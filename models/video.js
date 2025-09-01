'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Video extends Model {}
  Video.init({
    videoId: { 
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    publishedAt: DataTypes.DATE,
    thumbnailUrl: DataTypes.STRING,
    searchVector: DataTypes.TSVECTOR 
  }, {
    sequelize,
    modelName: 'Video',
    timestamps: false, 
    defaultScope: {
      order: [['publishedAt', 'DESC']], 
    },
  });
  return Video;
};