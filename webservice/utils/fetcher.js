export const GET = (url, token) => 
  fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    })
    .then(r => r.json())

export const POST = (url, token, data) =>
  fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: data === undefined ? "" : JSON.stringify(data)
    })
    .then(r => r.json())