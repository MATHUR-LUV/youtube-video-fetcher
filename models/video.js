// models/video.js
'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Video extends Model {}
  Video.init({
    videoId: { // Add this block
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    publishedAt: DataTypes.DATE,
    thumbnailUrl: DataTypes.STRING,
    searchVector: DataTypes.TSVECTOR // Add this for search
  }, {
    sequelize,
    modelName: 'Video',
    timestamps: false, // We don't need createdAt/updatedAt
    defaultScope: {
      order: [['publishedAt', 'DESC']], // Default sort order
    },
  });
  return Video;
};