var mentorRoles = ["community-contributor", "community-mentor", "*-champion", "*-advisor"];

function isExistInArr(array_1, array_2) {
  const arr_wildcard = array_2.filter(el => el.includes("*"))

  for (let i = 0; i < array_1.length; i++) {
    if (array_2.includes(array_1[i])) return true;

    for (let j = 0; j < arr_wildcard.length; j++) {
      const el = arr_wildcard[j];

      if (array_1[i].endsWith(
        el.slice(el.indexOf("*") + 1, el.length)
      )) return true
    }
  }
  return false;
}

export function isMentorRoleExist(arr) {
  return isExistInArr(arr, mentorRoles)
}