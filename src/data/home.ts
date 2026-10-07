import type { HeroSlide, Movie } from "../types/movie";

// Static Home page content. Poster colors stand in for artwork until real images are added.
export const heroSlides: HeroSlide[] = [
  {
    id: "the-odyssey",
    premiereLabel: "PREMIERE · WEEK OF 18 SEPT",
    title: "THE ODYSSEY",
    ageRating: "12+",
    duration: "134 Min",
    tags: ["MAX", "PANORAMA"],
    description:
      "A king spends ten years finding his way home from a war he already won, while monsters, gods, and his own restlessness make sure the return takes longer than the fighting did. By the time land comes back into view, the man arriving is not quite the one who left.",
    poster: { from: "#1c466e", to: "#070c1c", accent: "#8fb4d8", spotlightX: 72 },
  },
  {
    id: "dune-part-three",
    premiereLabel: "PREMIERE · WEEK OF 9 OCT",
    title: "DUNE: PART THREE",
    ageRating: "12+",
    duration: "166 Min",
    tags: ["MAX", "IMAX"],
    description:
      "On a world of dust and prophecy, the last heir of a fallen house returns to a war that has already chosen its winner. What he saves may not be the future his people were promised.",
    poster: { from: "#a86a32", to: "#1a0e08", accent: "#f0c27a", spotlightX: 64 },
  },
  {
    id: "the-cartographers-wife",
    premiereLabel: "IN CINEMAS 2 OCTOBER",
    title: "THE CARTOGRAPHER'S WIFE",
    ageRating: "12+",
    duration: "134 Min",
    tags: ["DRAMA"],
    description:
      "When a celebrated mapmaker disappears along a coast that does not exist on any chart, his wife follows the pencil marks he never published. The route home is shorter than the truth she finds there.",
    poster: { from: "#8a5a3a", to: "#140e0c", accent: "#f2d3b0", spotlightX: 70 },
  },
  {
    id: "nine-red-doors",
    premiereLabel: "NEW THIS WEEK",
    title: "NINE RED DOORS",
    ageRating: "16+",
    duration: "108 Min",
    tags: ["DRAMA"],
    description:
      "A quiet landing in an old apartment block hides nine red doors and one tenant who knows why they were painted that way. Opening the wrong one means meeting the neighbour you were never supposed to have.",
    poster: { from: "#6b2434", to: "#10080c", accent: "#f0c9c0", spotlightX: 68 },
  },
];

export const nowPlaying: Movie[] = [
  {
    id: "the-odyssey",
    title: "The Odyssey",
    genre: "Adventure",
    duration: "134 min",
    ageRating: "12+",
    priceLabel: "From £14",
    poster: { from: "#1a3d66", to: "#0b1018", accent: "#d7e4f2", spotlightX: 48 },
  },
  {
    id: "spider-man",
    title: "Spider-Man",
    genre: "Action",
    duration: "116 min",
    ageRating: "12+",
    priceLabel: "From £12",
    poster: { from: "#8d1f24", to: "#16080c", accent: "#ffb4a2", spotlightX: 42 },
  },
  {
    id: "dune-part-three",
    title: "Dune: Part Three",
    genre: "Sci-Fi",
    duration: "166 min",
    ageRating: "12+",
    priceLabel: "From £15",
    poster: { from: "#c4843c", to: "#1c1008", accent: "#ffe0a8", spotlightX: 55 },
  },
  {
    id: "avengers-doomsday",
    title: "Avengers: Doomsday",
    genre: "Action",
    duration: "149 min",
    ageRating: "12+",
    priceLabel: "From £14",
    poster: { from: "#243656", to: "#100c16", accent: "#f09a8a", spotlightX: 62 },
  },
  {
    id: "joker",
    title: "Joker",
    genre: "Thriller",
    duration: "122 min",
    ageRating: "16+",
    priceLabel: "From £11",
    poster: { from: "#1d4a38", to: "#100810", accent: "#d6c07a", spotlightX: 36 },
  },
  {
    id: "nine-red-doors",
    title: "Nine Red Doors",
    genre: "Drama",
    duration: "108 min",
    ageRating: "18+",
    priceLabel: "From £13",
    poster: { from: "#5c1e2c", to: "#12080c", accent: "#f2d2c8", spotlightX: 50 },
  },
];

export const comingSoon: Movie[] = [
  {
    id: "the-cartographers-wife",
    title: "The Cartographer's Wife",
    genre: "Drama",
    duration: "134 min",
    ageRating: "12+",
    releaseLabel: "IN CINEMAS 2 OCTOBER",
    poster: { from: "#8d6240", to: "#1a120c", accent: "#f6ddc4", spotlightX: 32 },
  },
  {
    id: "northern-lights",
    title: "Northern Lights",
    genre: "Romance",
    duration: "102 min",
    ageRating: "12+",
    releaseLabel: "IN CINEMAS 16 OCTOBER",
    poster: { from: "#146056", to: "#071018", accent: "#b8ffe4", spotlightX: 60 },
  },
  {
    id: "black-salt",
    title: "Black Salt",
    genre: "Thriller",
    duration: "118 min",
    ageRating: "16+",
    releaseLabel: "IN CINEMAS 23 OCTOBER",
    poster: { from: "#3a342c", to: "#10100e", accent: "#e7a25a", spotlightX: 44 },
  },
  {
    id: "paper-cities",
    title: "Paper Cities",
    genre: "Drama",
    duration: "127 min",
    ageRating: "12+",
    releaseLabel: "IN CINEMAS 6 NOVEMBER",
    poster: { from: "#3c3658", to: "#121018", accent: "#ddd0ff", spotlightX: 58 },
  },
];
