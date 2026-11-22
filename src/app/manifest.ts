import type { MetadataRoute } from "next";

/**
 * Lets a phone keep the whole app in one standalone window once it is added to the Home Screen.
 * `scope: "/"` is the point: without it a phone may treat only the page it was added from as "the app"
 * and open every other page in an in-app browser, address bar and all.
 * No start_url on purpose: the app then opens on the page it was added from, so a coordinator who adds
 * /board lands on the board and the demo's resident phone (/phone?number=…) lands on its own screen.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Relay MKE",
    short_name: "Relay MKE",
    description: "One shared record that closes the loop on every request for help in Milwaukee.",
    scope: "/",
    display: "standalone",
    background_color: "#f4f5f7",
    theme_color: "#0b93d5",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
