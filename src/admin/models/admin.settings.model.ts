import mongoose from "mongoose";
const { Schema } = mongoose;

const AdminSettingScehma = new Schema({
  name: {
    type: String,
    required: true,
  },
  values: {
    type: Schema.Types.Mixed,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Settings = mongoose.model("Settings", AdminSettingScehma);

export default Settings;
