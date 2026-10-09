export interface MovieProfile {
  id: string;
  genre: string;
  director: string;
  cast: string[];
  releaseDate: string;
  description: string;
}

const PROFILES: MovieProfile[] = [
  {
    id: "the-odyssey",
    genre: "Adventure",
    director: "Nino Beridze",
    cast: ["Irakli Kavsadze", "Mariam Gelovani", "Luka Kapanadze"],
    releaseDate: "18 September 2026",
    description:
      "A king spends ten years finding his way home from a war he already won. Monsters, gods, and his own restlessness make the return longer than the fighting.",
  },
  {
    id: "avengers-doomsday",
    genre: "Action",
    director: "Giorgi Lomidze",
    cast: ["Ana Tsiklauri", "Saba Metreveli", "Nika Chavchavadze"],
    releaseDate: "1 May 2026",
    description:
      "A scattered team is pulled back together when a threat they buried starts moving on its own. The plan that saves the city also ends the version of them that made it.",
  },
  {
    id: "spider-man",
    genre: "Action",
    director: "Tamar Kharabadze",
    cast: ["Luka Beridze", "Elene Maisuradze", "Gega Gogoladze"],
    releaseDate: "12 June 2026",
    description:
      "A student who can cross the city in a single swing keeps choosing the neighbourhood over the skyline. The night he stops looking down is the night the city notices.",
  },
  {
    id: "dune-part-three",
    genre: "Sci-Fi",
    director: "Levan Abashidze",
    cast: ["Nika Tsintsadze", "Salome Japaridze", "Data Kobiashvili"],
    releaseDate: "9 October 2026",
    description:
      "On a world of dust and prophecy, the last heir of a fallen house returns to a war that has already chosen its winner. What he saves is not the future his people were promised.",
  },
  {
    id: "joker",
    genre: "Thriller",
    director: "Mariam Okriashvili",
    cast: ["Giorgi Kvlividze", "Ana Papunashvili"],
    releaseDate: "4 October 2026",
    description:
      "A comedian who cannot get a room to laugh starts performing for an audience that never asked to be there. The joke lands, and then it keeps landing.",
  },
  {
    id: "nine-red-doors",
    genre: "Drama",
    director: "Sofia Kapanadze",
    cast: ["Nino Chkheidze", "Lasha Berishvili", "Tako Gelashvili"],
    releaseDate: "25 September 2026",
    description:
      "A quiet landing in an old apartment block hides nine red doors and one tenant who knows why they were painted that way. The wrong door introduces the neighbour you were never supposed to have.",
  },
  {
    id: "the-cartographers-wife",
    genre: "Drama",
    director: "Eka Javakhishvili",
    cast: ["Maka Kalandadze", "Irakli Tsulaia"],
    releaseDate: "2 October 2026",
    description:
      "When a celebrated mapmaker disappears along a coast that is missing from every chart, his wife follows the pencil marks he never published.",
  },
  {
    id: "northern-lights",
    genre: "Romance",
    director: "Ana Ghoghoberidze",
    cast: ["Salome Beridze", "Luka Tsereteli"],
    releaseDate: "16 October 2026",
    description:
      "Two people agree to share one winter in a town that only exists after dark. The lights come back in March. They do not.",
  },
  {
    id: "black-salt",
    genre: "Thriller",
    director: "Davit Khelaia",
    cast: ["Gega Maisuradze", "Nino Lomidze", "Saba Kvirkvelia"],
    releaseDate: "23 October 2026",
    description:
      "A harbour town starts pulling black salt out of nets that should have been empty. The people who taste it stop agreeing about what they saw the night before.",
  },
  {
    id: "paper-cities",
    genre: "Drama",
    director: "Ketevan Meshveliani",
    cast: ["Tamar Beridze", "Nika Okropiridze", "Mariam Tsiskaridze"],
    releaseDate: "6 November 2026",
    description:
      "An architect is hired to rebuild a district that exists only in her father's unfinished drawings. Every street she finishes erases one she remembers.",
  },
  {
    id: "moonlight",
    genre: "Drama",
    director: "Levan Tskhadaia",
    cast: ["Saba Gelashvili", "Ana Kobiashvili"],
    releaseDate: "20 November 2026",
    description:
      "Three chapters of one life, told in the hours when a coastal city is quiet enough to hear what was never said out loud.",
  },
  {
    id: "rustaveli",
    genre: "History",
    director: "Nino Kalandadze",
    cast: ["Irakli Beridze", "Mariam Chikovani", "Data Tsintsadze"],
    releaseDate: "14 November 2026",
    description:
      "A poem, a court, and the long walk between them. The film follows the people who carried the verses further than the poet could.",
  },
];

const BY_ID = new Map(PROFILES.map((profile) => [profile.id, profile]));

export function movieProfile(id: string): MovieProfile | undefined {
  return BY_ID.get(id);
}
