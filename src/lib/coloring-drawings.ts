export interface Drawing {
  id: string;
  title: string;
  imageUrl: string;
  thumbnail: string;
  artist?: string;
}

export const COLORING_DRAWINGS: Drawing[] = [
  {
    id: "simple-house",
    title: "Dinossauro",
    imageUrl: "https://static-cse.canva.com/blob/610548/dinossauroparacolorir.jpg",
    thumbnail: "https://static-cse.canva.com/blob/610548/dinossauroparacolorir.jpg",
    artist: "Freepik"
  },
  {
    id: "butterfly",
    title: "Sereia",
    imageUrl: "https://static-cse.canva.com/blob/610543/sereiadesenhocolorir.jpg",
    thumbnail: "https://static-cse.canva.com/blob/610543/sereiadesenhocolorir.jpg",
    artist: "Freepik"
  },
  {
    id: "flower",
    title: "Coruja",
    imageUrl: "https://static-cse.canva.com/blob/610513/corujaparacolorir.jpg",
    thumbnail: "https://static-cse.canva.com/blob/610513/corujaparacolorir.jpg",
    artist: "Freepik"
  },
  {
    id: "tree",
    title: "Gato",
    imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTIGgsO5st0I_oOW_ORB7Wigl82j1KWbf2QRg&s",
    thumbnail: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTIGgsO5st0I_oOW_ORB7Wigl82j1KWbf2QRg&s",
    artist: "Freepik"
  },
  {
    id: "cat",
    title: "Sonic",
    imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQmALmRp4xZ1KpG1vMM-pGRR9fNHkbEyIUjpQ&s",
    thumbnail: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQmALmRp4xZ1KpG1vMM-pGRR9fNHkbEyIUjpQ&s",
    artist: "Freepik"
  }
];