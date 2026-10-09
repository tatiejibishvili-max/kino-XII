import type { PosterTheme } from "../types/movie";
import type { LanguageId, Session, SessionCatalog, SessionMovie } from "../types/session";
import { addDays, formatISODate, startOfDay } from "../lib/sessions/dates";
import { LANGUAGES, VENUES } from "./sessionOptions";

const PALETTES: PosterTheme[] = [
  { from: "#1a3d66", to: "#0b1018", accent: "#d7e4f2", spotlightX: 48 },
  { from: "#243656", to: "#100c16", accent: "#f09a8a", spotlightX: 62 },
  { from: "#8d1f24", to: "#16080c", accent: "#ffb4a2", spotlightX: 42 },
  { from: "#c4843c", to: "#1c1008", accent: "#ffe0a8", spotlightX: 55 },
  { from: "#1d4a38", to: "#100810", accent: "#d6c07a", spotlightX: 36 },
  { from: "#5c1e2c", to: "#12080c", accent: "#f2d2c8", spotlightX: 50 },
];

const MOVIES: Omit<SessionMovie, "poster">[] = [
  { id: "the-odyssey", title: "The Odyssey", ageRating: "G", duration: "134 min" },
  { id: "avengers-doomsday", title: "Avengers: Doomsday", ageRating: "12+", duration: "149 min" },
  { id: "spider-man", title: "Spider-Man", ageRating: "12+", duration: "116 min" },
  { id: "dune-part-three", title: "Dune: Part Three", ageRating: "12+", duration: "166 min" },
  { id: "joker", title: "Joker", ageRating: "16+", duration: "122 min" },
  { id: "nine-red-doors", title: "Nine Red Doors", ageRating: "18+", duration: "108 min" },
  { id: "the-cartographers-wife", title: "The Cartographer's Wife", ageRating: "12+", duration: "134 min" },
  { id: "northern-lights", title: "Northern Lights", ageRating: "PG", duration: "102 min" },
  { id: "black-salt", title: "Black Salt", ageRating: "16+", duration: "118 min" },
  { id: "paper-cities", title: "Paper Cities", ageRating: "12+", duration: "127 min" },
  { id: "moonlight", title: "Moonlight", ageRating: "16+", duration: "111 min" },
  { id: "rustaveli", title: "Rustaveli", ageRating: "G", duration: "98 min" },
];

const SLOT_TIMES = ["10:15", "16:30", "19:15", "14:00"];
const HALLS = ["Hall A", "Hall B", "Hall C", "Hall D"];

function moviesWithPosters(): SessionMovie[] {
  return MOVIES.map((movie, index) => ({
    ...movie,
    poster: PALETTES[index % PALETTES.length],
  }));
}

export function buildSessionCatalog(now = new Date()): SessionCatalog {
  const today = startOfDay(now);
  const dates = Array.from({ length: 7 }, (_, index) => formatISODate(addDays(today, index)));
  const movies = moviesWithPosters();
  const sessions: Session[] = [];

  movies.forEach((movie, movieIndex) => {
    for (let day = 0; day < dates.length; day += 1) {
      if (day !== 0 && (movieIndex + day) % 3 === 0) continue;

      const slotCount = day === 0 ? 3 : 2;
      for (let slot = 0; slot < slotCount; slot += 1) {
        const venue = VENUES[(movieIndex + slot) % VENUES.length];
        const format = venue.formats[(movieIndex + slot) % venue.formats.length];
        const language = LANGUAGES[(movieIndex + slot + day) % LANGUAGES.length].id as LanguageId;
        const seatSeed = movieIndex + slot + day;

        sessions.push({
          id: `${movie.id}-${day}-${slot}`,
          movieId: movie.id,
          venueId: venue.id,
          hall: HALLS[(movieIndex + slot) % HALLS.length],
          date: dates[day],
          startTime: SLOT_TIMES[(movieIndex + slot) % SLOT_TIMES.length],
          format,
          language,
          price: 12 + ((movieIndex + slot * 2) % 8) * 2,
          seatsRemaining: seatSeed % 9 === 0 ? 0 : seatSeed % 9 === 1 ? 4 : 18 + slot * 5,
        });
      }
    }
  });

  return {
    venues: VENUES,
    movies,
    sessions,
    dates,
    today: dates[0],
  };
}
