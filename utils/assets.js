import fs from "fs"
import path from "path"

const assetsDir = path.join(process.cwd(), "assets");
const filetreeDir = path.join(assetsDir, "filetree");

export function getAssetFile(filename, dir="") {
  return fs.readFileSync(path.join(assetsDir, dir, filename), "utf8");
}

export function getAssetFileAbs(filepath) {
  return fs.readFileSync(filepath, "utf8");
}

export function getFileTree (dir=filetreeDir, files_){
  files_ = files_ || {
    "/": []
  };
  var files = fs.readdirSync(dir);

  for (var i in files){
    var name = dir + '/' + files[i];
    let filetreeName = name.replace(filetreeDir + "/", "")
    
    if (fs.statSync(name).isDirectory()){
      let lastDir = "/"
      if (filetreeName.includes("/"))
        lastDir = filetreeName.split("/").slice(0, -1).join("/");
      const currDir = filetreeName.split("/").pop() 
        
      files_[lastDir].push({
        name: currDir,
        type: "directory" 
      })
            
      files_[filetreeName] = []
      getFileTree(name, files_);

    } else {
      const dirOnly = filetreeName.split("/").slice(0, -1).join("/")
      const fileOnly = filetreeName.split("/").pop() 

      files_[dirOnly].push({
        name: fileOnly,
        type: "file",
        content: getAssetFileAbs(name)
      });
    }
  }
  return files_;
}