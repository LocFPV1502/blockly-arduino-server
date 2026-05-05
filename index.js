const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

app.post('/compile', (req, res) => {
    const { code, board = 'arduino:avr:nano' } = req.body;
    
    if (!code) {
        return res.status(400).json({ success: false, error: 'Không có code C++ được gửi lên.' });
    }

    const id = uuidv4();
    const sketchName = `arduino-${id}`;
    const tmpDir = path.join('/tmp', sketchName);

    try {
        fs.mkdirSync(tmpDir, { recursive: true });
        
        const sketchPath = path.join(tmpDir, `${sketchName}.ino`);
        fs.writeFileSync(sketchPath, code);

        const cmd = `arduino-cli compile --fqbn ${board} --output-dir ${tmpDir} ${tmpDir}`;

        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                fs.rmSync(tmpDir, { recursive: true, force: true });
                return res.status(400).json({ success: false, error: stderr || stdout });
            }

            const files = fs.readdirSync(tmpDir);
            const firmwareFile = files.find(f => f.endsWith('.hex') || f.endsWith('.bin'));

            if (!firmwareFile) {
                fs.rmSync(tmpDir, { recursive: true, force: true });
                return res.status(500).json({ success: false, error: 'Không tìm thấy file firmware sau khi biên dịch.' });
            }

            const firmwarePath = path.join(tmpDir, firmwareFile);
            const firmwareBase64 = fs.readFileSync(firmwarePath, { encoding: 'base64' });

            fs.rmSync(tmpDir, { recursive: true, force: true });

            res.json({
                success: true,
                firmware: firmwareBase64,
                filename: firmwareFile
            });
        });
    } catch (err) {
        if (fs.existsSync(tmpDir)) {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
        res.status(500).json({ success: false, error: err.message });
    }
});

// Render sẽ cấp port qua biến môi trường PORT
const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Compiler Server đang chạy tại cổng ${PORT}`);
});
