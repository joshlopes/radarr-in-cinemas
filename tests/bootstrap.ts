import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({
    path: path.join(import.meta.dir, '/../.env.test'),
    debug: false
})
