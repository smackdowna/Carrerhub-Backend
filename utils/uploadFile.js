const imageKit = require("../config/imageKit.js");

const uploadFile = (file, fileName, folder) => {
  return new Promise((resolve, reject) => {
    imageKit.upload(
      {
        file,
        fileName,
        folder: folder,
      },
      (err, result) => {
        if (err) {
          return reject(err.message);
        } else {
          return resolve(result);
        }
      }
    );
  });
};

const deleteFile = (fileId) => {
  return new Promise((resolve, reject) => {
    imageKit.deleteFile(fileId, (err, result) => {
      if (err) {
        return reject(err.message);
      } else {
        return resolve(result);
      }
    });
  });
};

module.exports = {
  uploadFile,
  deleteFile,
};
