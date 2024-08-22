// server.js
const express = require('express')
const multer = require('multer')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')
const { Buffer } = require('buffer')

// Initialize Prisma Client
const prisma = new PrismaClient()

const storage = multer.memoryStorage() // Store file in memory

const types = [
  'video/mp4',
  'video/mp3',
  'video/ogg',
  'audio/mpeg',
  'audio/mp3',
  'audio/ogg',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml'
]

const fileFilter = (req, file, cb) => {
  if (types.includes(file.mimetype)) { // Check if the file's mimetype is in the allowed types
    cb(null, true)  // Accept the file
  } else {
    cb(new Error('Only .mp4 and .png files are allowed!'), false) // Reject the file
  }
}

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024  // 15 MB
  },
  fileFilter
})

const app = express()
app.use(cors())

const port = 3000

app.get("/", (req, res) => res.send("Express on Vercel"));

app.post('/upload', async (req, res) => {
  upload.single('test')(req, res, async (err) => {
    if (err) {
      console.log('error', err)
      res.status(400).json({ message: 'upload fail', error: err.message })
      return
    }

    try {
      const { file } = req
      const { originalname, mimetype, buffer } = file

      // Convert file buffer to Base64 string
      const base64Data = buffer.toString('base64')

      // Save file metadata and Base64 data to the database using Prisma
      const savedFile = await prisma.file.create({
        data: {
          filename: file.originalname,
          originalname: originalname,
          mimetype: mimetype,
          size: buffer.length,
          data: base64Data
        }
      })

      res.send(savedFile)
    } catch (dbError) {
      console.log('Database error', dbError)
      res.status(500).json({ message: 'Database error', error: dbError.message })
    }
  })
})

app.get('/files', async (req, res) => {
    try {
      const files = await prisma.file.findMany();
      // Add a data URL to the file objects
      const filesWithDataUrl = files.map(file => ({
        ...file,
        dataUrl: `data:${file.mimetype};base64,${file.data}`
      }));
      res.json(filesWithDataUrl);
    } catch (error) {
      console.log('Error fetching files', error);
      res.status(500).json({ message: 'Error fetching files', error: error.message });
    }
  });


app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`)
})
