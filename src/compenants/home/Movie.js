// Films available locally. Poster filenames match the files in
// public/assets/posters, including their existing spelling.
export const movies = [
  {
    id: 1,
    title: "Inception",
    release_date: "2010-07-16",
    url: "/assets/posters/inception.jpg",
  },
  {
    id: 2,
    title: "Interstellar",
    release_date: "2014-11-07",
    url: "/assets/posters/instellar.jpg",
  },
  {
    id: 3,
    title: "The Dark Knight",
    release_date: "2008-07-18",
    url: "/assets/posters/dark-knight.jpg",
  },
  {
    id: 4,
    title: "Pulp Fiction",
    release_date: "1994-10-14",
    url: "/assets/posters/pulp-iction.jpg",
  },
  // No poster asset exists for this film yet; the card renders a text fallback.
  {
    id: 5,
    title: "The Matrix",
    release_date: "1999-03-31",
    url: null,
  },
];
