import profilePicture1 from '../ressources/users_pp/1.png';
import profilePicture2 from '../ressources/users_pp/2.png';
import profilePicture3 from '../ressources/users_pp/3.png';
import profilePicture4 from '../ressources/users_pp/4.png';
import profilePicture5 from '../ressources/users_pp/5.png';
import profilePicture6 from '../ressources/users_pp/6.png';
import profilePicture7 from '../ressources/users_pp/7.png';
import profilePicture8 from '../ressources/users_pp/8.png';
import profilePicture9 from '../ressources/users_pp/9.png';
import profilePicture10 from '../ressources/users_pp/10.png';
import profilePicture11 from '../ressources/users_pp/11.png';
import profilePicture12 from '../ressources/users_pp/12.png';
import profilePicture13 from '../ressources/users_pp/13.png';
import profilePicture14 from '../ressources/users_pp/14.png';
import profilePicture15 from '../ressources/users_pp/15.png';

export const profilePictures = [
  { id: '1.png', src: profilePicture1 },
  { id: '2.png', src: profilePicture2 },
  { id: '3.png', src: profilePicture3 },
  { id: '4.png', src: profilePicture4 },
  { id: '5.png', src: profilePicture5 },
  { id: '6.png', src: profilePicture6 },
  { id: '7.png', src: profilePicture7 },
  { id: '8.png', src: profilePicture8 },
  { id: '9.png', src: profilePicture9 },
  { id: '10.png', src: profilePicture10 },
  { id: '11.png', src: profilePicture11 },
  { id: '12.png', src: profilePicture12 },
  { id: '13.png', src: profilePicture13 },
  { id: '14.png', src: profilePicture14 },
  { id: '15.png', src: profilePicture15 },
];

export const getProfilePictureSrc = (id?: string | null) => {
  if (!id) {
    return null;
  }

  return profilePictures.find(profilePicture => profilePicture.id === id)?.src ?? null;
};
