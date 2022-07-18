export const GET = (url, is_raw=false, token=null) => 
  fetch(url, {
      headers: {
        "Authorization": token === null ? "" : `Bearer ${token}`,
      },
    })
    .then((response) => {
      if (response.ok) {
        return !is_raw ? response.json() : response.blob();
      }

      throw new Error(`${response.status} ${response.statusText}`)
    })

export const POST = (url, data=null, token=null) =>
  fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token === null ? "" : `Bearer ${token}`,
      },
      body: data === null ? "" : JSON.stringify(data)
    })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }

      throw new Error(`${response.status} ${response.statusText}`)
    })