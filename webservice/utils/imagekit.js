import ImageKit from "imagekit";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

export function upload_character_image(image_base64, image_name, callbackfn) {
  imagekit.upload({
    file: image_base64,
    fileName: `${image_name}.png`,
    folder: "/characters",
    useUniqueFileName: false
  }).then(response => {
    return callbackfn(true, response)
  }).catch(error => {
    return callbackfn(false, error)
  });
}

export default function get_character_url(image_name) {
  return imagekit.url({
    path: `/characters/${image_name}.png`,
  });
}