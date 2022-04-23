var mentorRoles = ["Community Contributor", "Community Mentor"];

function isExistInArr(array_1, array_2) {
  for (let i = 0; i < array_1.length; i++) 
    if (array_2.includes(array_1[i])) return true;
  return false;
}

export function isMentorRoleExist(arr) {
    return isExistInArr(arr, mentorRoles)
}