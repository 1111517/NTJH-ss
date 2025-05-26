const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 16835;

// 提供靜態檔案（index.html、style.css、main.js 等）
app.use(express.static(__dirname));

// 載入資料
const classData = JSON.parse(fs.readFileSync('class_schedule.json', 'utf8'));
const teacherData = JSON.parse(fs.readFileSync('teacher_schedule.json', 'utf8'));

// API 路徑
app.get('/api', (req, res) => {
    const { type, name, day, period } = req.query;

    if (type === 'teacher') {
        const teacher = teacherData.find(t => t.name === name);
        if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

        if (day === undefined) {
            // 只帶 name，回傳整個老師物件
            return res.json(teacher);
        }
        const d = parseInt(day, 10);
        if (period === undefined) {
            // 帶 name 和 day，回傳該天所有節次
            return res.json(teacher.schedule?.[d] || null);
        }
        const p = parseInt(period, 10);
        // 帶齊 name、day、period，回傳單一節次
        return res.json(teacher.schedule?.[d]?.[p] || null);

    } else if (type === 'class') {
        const cls = classData.find(c => c.name === name);
        if (!cls) return res.status(404).json({ error: 'Class not found' });

        if (day === undefined) {
            // 只帶 name，回傳整個班級物件
            return res.json(cls);
        }
        const d = parseInt(day, 10);
        if (period === undefined) {
            // 帶 name 和 day，回傳該天所有節次
            return res.json(cls.schedule?.[d] || null);
        }
        const p = parseInt(period, 10);
        // 帶齊 name、day、period，回傳單一節次
        return res.json(cls.schedule?.[d]?.[p] || null);

    } else {
        return res.status(400).json({ error: 'Invalid type' });
    }
});

// 啟動伺服器
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});