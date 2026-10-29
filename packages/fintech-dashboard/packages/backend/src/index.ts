import { app } from './app'
const port = Number(process.env.PORT) || 3001

// Start server only when not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`)
  })
}

export { app }
