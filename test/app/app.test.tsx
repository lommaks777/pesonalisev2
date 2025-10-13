import React from "react";
import { render } from "@testing-library/react";
import Home from "@/app/page";

describe("Home page", () => {
  it("redirects to dashboard", () => {
    expect(() => render(<Home />)).toThrow(/NEXT_REDIRECT/);
  });
});

