/**
 * Get a default avatar URL using DiceBear API with initials style
 * @param email User's email to generate the avatar from
 * @returns URL to the default avatar
 */
export const getDefaultAvatar = (email: string): string => {
  const username = email.split('@')[0];
  return `https://api.dicebear.com/7.x/initials/svg?seed=${username}&backgroundColor=2563eb&textColor=white`;
};
