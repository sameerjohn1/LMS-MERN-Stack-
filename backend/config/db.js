import mongoose from "mongoose";

export const connectDB = async () => {
  mongoose
    .connect(
      "mongodb+srv://sameerprogrammer5_db_user:OCnjWdZpnzodCs9F@cluster0.70ktcqz.mongodb.net/L-M-S"
    )
    .then(() => console.log("DB Connected"));
};
