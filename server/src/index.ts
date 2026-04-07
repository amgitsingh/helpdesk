import 'dotenv/config'; // must be first — loads env before any other module reads process.env
import app from './app';

const PORT = process.env.PORT ?? 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
