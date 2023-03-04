import multer from "multer";
import Product from "../models/product.js";
import path from "path";
import fs from "fs";
import customeErrorHandler from "../services/customeErrorHandler.js";
import product from "../models/product.js";
import Joi from "joi";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads");
    // check if directory exists
    fs.access(uploadDir, (error) => {
      if (error) {
        // create the directory if it doesn't exist
        fs.mkdir(uploadDir, { recursive: true }, (error) => {
          if (error) {
            cb(error, null);
          } else {
            cb(null, uploadDir);
          }
        });
      } else {
        cb(null, uploadDir);
      }
    });
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1E9
    )}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const handleMultipartData = multer({
  storage,
  limits: { fileSize: 1000000 * 5 },
}).single("image");

const productController = {
  async store(req, res, next) {
    handleMultipartData(req, res, async (error) => {
      if (error) {
        return next(customeErrorHandler.serverError(error.message));
      }
      console.log(req.file);
      const filePath = req.file.path;

      const productSchema = Joi.object({
        name: Joi.string().required(),
        price: Joi.number().required(),
        size: Joi.string().required(),
        image: Joi.string()
      });

      const { error: validationError } = productSchema.validate(req.body);
      if (validationError) {
        fs.unlink(`${appRoot}/${filePath}`, (error) => {
          return next(customeErrorHandler.serverError(error.message));
        });

        return next(validationError);
      }

      const { name, price, size } = req.body;
      let document;
      try {
        document = await product.create({
          name,
          price,
          size,
          image: filePath,
        });
      } catch (error) {
        return next(error);
      }
      res.status(201).json(document);
    });
  },

    update (req, res, next){
    handleMultipartData(req, res, async (error) => {
      if (error) {
        return next(customeErrorHandler.serverError(error.message));
      }
      
      let filePath;
      if(req.file){
        filePath = req.file.path;
      }
      
      const productSchema = Joi.object({
        name: Joi.string().required(),
        price: Joi.number().required(),
        size: Joi.string().required(),
        image: Joi.string()
      });

      if(req.file){
        const { error: validationError } = productSchema.validate(req.body);
      if (validationError) {
        fs.unlink(`${appRoot}/${filePath}`, (error) => {
          if(error){
            return next(customeErrorHandler.serverError(error.message));
          }
          
        });
      }

        return next(validationError);
      }

      const { name, price, size } = req.body;
      let document;
      try {
        document = await product.findOneAndUpdate({_id:req.params},{
          name,
          price,
          size,
          ...(req.file && {image: filePath})
        },{new: true});
        console.log(document);
      } catch (error) {
        return next(error);
      }
      res.status(201).json(document);
    });
   },

   async distroy(req, res, next){

    const document = await product.findOneAndRemove({_id: req.params.id});
    if(!document) {
      return next(new Error('nothing to delete'));
    }
    //image delete
    const imagePath = document.image;
    fs.unlink(`${appRoot}/${imagePath}`, (error) =>{
      if(error){
        return next(customeErrorHandler.serverError(error.message));
      }
    });
    res.json(document)
   }

};

export default productController;
