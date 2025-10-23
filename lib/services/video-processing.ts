/**
 * Video Processing Service
 * 
 * Handles video downloading, audio extraction, and audio chunking
 * for the course onboarding pipeline.
 * 
 * Features:
 * - Download videos with resume support
 * - Extract audio tracks using FFmpeg
 * - Chunk audio files for Whisper API compliance (25 MB limit)
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

export interface DownloadOptions {
  url: string;
  outputPath: string;
  resumeSupport?: boolean;
  onProgress?: (downloaded: number, total: number) => void;
}

export interface AudioExtractionOptions {
  inputPath: string;
  outputPath: string;
  format?: 'mp3' | 'wav';
  bitrate?: string;
}

export interface ChunkOptions {
  inputPath: string;
  outputDir: string;
  segmentDuration?: number; // seconds
  maxSizeMB?: number;
}

/**
 * Download video file with resume capability
 * 
 * @param options Download configuration
 * @returns Promise that resolves when download completes
 */
export async function downloadVideo(options: DownloadOptions): Promise<void> {
  const {
    url,
    outputPath,
    resumeSupport = true,
    onProgress,
  } = options;

  // Create directory if it doesn't exist
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Check if file already exists and get its size for resume
  let startByte = 0;
  if (resumeSupport && fs.existsSync(outputPath)) {
    const stats = fs.statSync(outputPath);
    startByte = stats.size;
    console.log(`📂 Found partial file (${(startByte / 1024 / 1024).toFixed(1)} MB), resuming download...`);
  }

  try {
    const headers: any = {};
    if (startByte > 0) {
      headers['Range'] = `bytes=${startByte}-`;
    }

    const response = await axios({
      method: 'GET',
      url,
      responseType: 'stream',
      headers,
      timeout: 60000, // 60 seconds for initial connection
    });

    const totalSize = startByte + parseInt(response.headers['content-length'] || '0', 10);
    let downloadedSize = startByte;

    const writer = fs.createWriteStream(outputPath, {
      flags: startByte > 0 ? 'a' : 'w', // append if resuming, write if new
    });

    response.data.on('data', (chunk: Buffer) => {
      downloadedSize += chunk.length;
      
      if (onProgress) {
        onProgress(downloadedSize, totalSize);
      }
    });

    return new Promise<void>((resolve, reject) => {
      response.data.pipe(writer);
      
      writer.on('finish', () => {
        // Validate downloaded file
        const finalStats = fs.statSync(outputPath);
        if (finalStats.size > 0) {
          console.log(`✅ Download complete: ${(finalStats.size / 1024 / 1024).toFixed(1)} MB`);
          resolve();
        } else {
          reject(new Error('Downloaded file is empty'));
        }
      });
      
      writer.on('error', (error) => {
        reject(new Error(`Write error: ${error.message}`));
      });
      
      response.data.on('error', (error: Error) => {
        reject(new Error(`Download error: ${error.message}`));
      });
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to download video: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Extract audio track from video file using FFmpeg
 * 
 * @param options Audio extraction configuration
 * @returns Promise that resolves when extraction completes
 */
export async function extractAudio(options: AudioExtractionOptions): Promise<void> {
  const {
    inputPath,
    outputPath,
    format = 'mp3',
    bitrate = '128k',
  } = options;

  // Validate input file exists
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input video file not found: ${inputPath}`);
  }

  // Create output directory
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Determine FFmpeg audio codec based on format
  const audioCodec = format === 'mp3' ? 'libmp3lame' : 'pcm_s16le';

  // Build FFmpeg command
  const args = [
    '-i', inputPath,
    '-vn', // no video
    '-acodec', audioCodec,
    '-b:a', bitrate,
    '-y', // overwrite output file
    outputPath,
  ];

  return new Promise<void>((resolve, reject) => {
    console.log(`🎵 Extracting audio: ffmpeg ${args.join(' ')}`);
    
    const ffmpeg = spawn('ffmpeg', args);

    let stderrOutput = '';

    ffmpeg.stderr.on('data', (data) => {
      stderrOutput += data.toString();
      
      // Extract progress information (FFmpeg outputs progress to stderr)
      const timeMatch = data.toString().match(/time=(\d+):(\d+):(\d+\.\d+)/);
      if (timeMatch) {
        const [, hours, minutes, seconds] = timeMatch;
        const totalSeconds = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseFloat(seconds);
        process.stdout.write(`\r   Progress: ${Math.floor(totalSeconds)}s processed`);
      }
    });

    ffmpeg.on('close', (code) => {
      console.log(''); // newline after progress
      
      if (code !== 0) {
        reject(new Error(`FFmpeg exited with code ${code}\n${stderrOutput}`));
        return;
      }

      // Validate output file
      if (!fs.existsSync(outputPath)) {
        reject(new Error('Audio extraction failed: output file not created'));
        return;
      }

      const stats = fs.statSync(outputPath);
      if (stats.size === 0) {
        reject(new Error('Audio extraction failed: output file is empty'));
        return;
      }

      console.log(`✅ Audio extracted: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);
      resolve();
    });

    ffmpeg.on('error', (error) => {
      reject(new Error(`Failed to spawn FFmpeg: ${error.message}`));
    });
  });
}

/**
 * Chunk audio file into segments for Whisper API
 * 
 * @param options Chunking configuration
 * @returns Array of chunk file paths in order
 */
export async function chunkAudio(options: ChunkOptions): Promise<string[]> {
  const {
    inputPath,
    outputDir,
    segmentDuration = 600, // 10 minutes default
    maxSizeMB = 20, // safety margin under 25 MB limit
  } = options;

  // Validate input file
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input audio file not found: ${inputPath}`);
  }

  const stats = fs.statSync(inputPath);
  const sizeMB = stats.size / (1024 * 1024);

  // If file is already small enough, no chunking needed
  if (sizeMB < maxSizeMB) {
    console.log(`ℹ️  Audio file is ${sizeMB.toFixed(1)} MB (under ${maxSizeMB} MB limit), no chunking needed`);
    return [inputPath];
  }

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPattern = path.join(outputDir, 'chunk_%03d.mp3');

  // Build FFmpeg command for segmenting
  const args = [
    '-i', inputPath,
    '-f', 'segment',
    '-segment_time', segmentDuration.toString(),
    '-c', 'copy', // copy codec (no re-encoding)
    '-y',
    outputPattern,
  ];

  return new Promise<string[]>((resolve, reject) => {
    console.log(`✂️  Chunking audio into ${segmentDuration}s segments...`);
    console.log(`   Command: ffmpeg ${args.join(' ')}`);
    
    const ffmpeg = spawn('ffmpeg', args);

    let stderrOutput = '';

    ffmpeg.stderr.on('data', (data) => {
      stderrOutput += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`FFmpeg chunking failed with code ${code}\n${stderrOutput}`));
        return;
      }

      // Find all generated chunk files
      const files = fs.readdirSync(outputDir);
      const chunkFiles = files
        .filter(f => f.startsWith('chunk_') && f.endsWith('.mp3'))
        .sort()
        .map(f => path.join(outputDir, f));

      if (chunkFiles.length === 0) {
        reject(new Error('No chunk files were created'));
        return;
      }

      // Validate all chunks are under size limit
      for (const chunkFile of chunkFiles) {
        const chunkStats = fs.statSync(chunkFile);
        const chunkSizeMB = chunkStats.size / (1024 * 1024);
        
        if (chunkSizeMB > maxSizeMB) {
          console.warn(`⚠️ Warning: Chunk ${path.basename(chunkFile)} is ${chunkSizeMB.toFixed(1)} MB (over ${maxSizeMB} MB limit)`);
        }
      }

      console.log(`✅ Created ${chunkFiles.length} audio chunks`);
      resolve(chunkFiles);
    });

    ffmpeg.on('error', (error) => {
      reject(new Error(`Failed to spawn FFmpeg for chunking: ${error.message}`));
    });
  });
}

/**
 * Verify FFmpeg is installed and accessible
 * 
 * @returns Promise that resolves to true if FFmpeg is available
 */
export async function verifyFFmpeg(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const ffmpeg = spawn('ffmpeg', ['-version']);
    
    ffmpeg.on('close', (code) => {
      resolve(code === 0);
    });
    
    ffmpeg.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Get FFmpeg version string
 * 
 * @returns FFmpeg version or null if not available
 */
export async function getFFmpegVersion(): Promise<string | null> {
  return new Promise<string | null>((resolve) => {
    const ffmpeg = spawn('ffmpeg', ['-version']);
    
    let output = '';
    
    ffmpeg.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        const versionMatch = output.match(/ffmpeg version (\S+)/);
        resolve(versionMatch ? versionMatch[1] : null);
      } else {
        resolve(null);
      }
    });
    
    ffmpeg.on('error', () => {
      resolve(null);
    });
  });
}
