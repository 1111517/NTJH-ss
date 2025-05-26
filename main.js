window.onload = function() {
    let classData = [];
    let teacherData = [];
    let currentCls = null;
    let currentTeacher = null;
    let lastMode = 'class'; // 'class' or 'teacher'

    // 載入班級與導師資料
    Promise.all([
        fetch('class_schedule.json').then(res => res.json()),
        fetch('teacher_schedule.json').then(res => res.json())
    ]).then(([classJson, teacherJson]) => {
        classData = classJson;
        teacherData = teacherJson;
        setupSidebar();
        setupSplitMode();
        // 預設顯示第一個班級
        if (classData.length > 0) showClassSchedule(classData[0]);
    });

    function setupSidebar() {
        const sidebar = document.getElementById('sidebar');
        const themeToggle = document.getElementById('theme-toggle');
        // 依年級分類
        const grades = { "一年級": [], "二年級": [], "三年級": [] };
        classData.forEach((cls, idx) => {
            if (cls.name.startsWith("1年")) grades["一年級"].push({ ...cls, idx });
            else if (cls.name.startsWith("2年")) grades["二年級"].push({ ...cls, idx });
            else if (cls.name.startsWith("3年")) grades["三年級"].push({ ...cls, idx });
        });
        // 清除舊的 ul
        sidebar.querySelectorAll('ul, details').forEach(e => e.remove());

        // 新增首頁/關於連結
        const staticUl = document.createElement('ul');
        staticUl.innerHTML = `
            <li><a href="index.html">首頁</a></li>
            <li><a href="about.html">關於</a></li>
        `;
        sidebar.insertBefore(staticUl, themeToggle);

        // 班級分類
        Object.entries(grades).forEach(([grade, classes]) => {
            if (classes.length === 0) return;
            const details = document.createElement('details');
            const summary = document.createElement('summary');
            summary.textContent = grade;
            details.appendChild(summary);
            const ul = document.createElement('ul');
            classes.forEach(cls => {
                const li = document.createElement('li');
                li.innerHTML = `<a href="#" data-idx="${cls.idx}">${cls.name}</a>`;
                ul.appendChild(li);
            });
            details.appendChild(ul);
            sidebar.insertBefore(details, themeToggle);
        });
        // 教師分類
        const teacherDetails = document.createElement('details');
        const teacherSummary = document.createElement('summary');
        teacherSummary.textContent = '教師';
        teacherDetails.appendChild(teacherSummary);
        const teacherUl = document.createElement('ul');
        teacherData.forEach((teacher, idx) => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="#" data-teacher-idx="${idx}">${teacher.name}</a>`;
            teacherUl.appendChild(li);
        });
        teacherDetails.appendChild(teacherUl);
        sidebar.insertBefore(teacherDetails, themeToggle);

        // 點擊班級
        sidebar.addEventListener('click', function(e) {
            if (e.target.tagName === 'A' && e.target.hasAttribute('data-idx')) {
                e.preventDefault();
                const idx = e.target.getAttribute('data-idx');
                showClassSchedule(classData[idx]);
                // 標記 active
                sidebar.querySelectorAll('a[data-idx]').forEach(a => a.classList.remove('active'));
                e.target.classList.add('active');
            }
            // 點擊導師
            if (e.target.tagName === 'A' && e.target.hasAttribute('data-teacher-idx')) {
                e.preventDefault();
                const idx = e.target.getAttribute('data-teacher-idx');
                showTeacherSchedule(teacherData[idx]);
                // 標記 active
                sidebar.querySelectorAll('a[data-teacher-idx]').forEach(a => a.classList.remove('active'));
                e.target.classList.add('active');
            }
        });
    }

    // 併排模式切換
    function setupSplitMode() {
        const splitBtn = document.getElementById('split-mode-toggle');
        splitBtn.addEventListener('click', () => {
            if (!document.body.classList.contains('split-mode')) {
                splitBtn.textContent = '檢視模式';
                enterSplitMode();
            } else {
                splitBtn.textContent = '併排模式';
                exitSplitMode();
            }
        });
    }

    // 進入 split mode
    function enterSplitMode() {
        document.body.classList.add('split-mode');
        document.getElementById('sidebar').style.display = 'none';

        let mainContent = document.getElementById('main-content');
        let splitRow = document.createElement('div');
        splitRow.className = 'split-row';

        // 左側
        const leftCol = document.createElement('div');
        leftCol.className = 'split-col left-col';
        leftCol.appendChild(document.getElementById('class-title'));
        leftCol.appendChild(document.getElementById('schedule-table'));

        // 右側
        const rightCol = document.createElement('div');
        rightCol.className = 'split-col right-col';
        rightCol.appendChild(document.getElementById('teacher-title'));
        rightCol.appendChild(document.getElementById('teacher-schedule-table'));

        splitRow.appendChild(leftCol);
        splitRow.appendChild(rightCol);

        // 只移除 mainContent 下的 split-row
        const oldSplitRow = mainContent.querySelector('.split-row');
        if (oldSplitRow) oldSplitRow.remove();
        mainContent.appendChild(splitRow);

        // 顯示兩個課表
        document.getElementById('teacher-title').style.display = 'block';
        document.getElementById('teacher-schedule-table').style.display = 'block';
        document.getElementById('class-title').style.display = 'block';
        document.getElementById('schedule-table').style.display = 'block';
    }

    // 離開 split mode
    function exitSplitMode() {
        document.body.classList.remove('split-mode');
        document.getElementById('sidebar').style.display = '';
        let mainContent = document.getElementById('main-content');
        // 只移除 split-row，不用 innerHTML = ''
        const splitRow = mainContent.querySelector('.split-row');
        if (splitRow) {
            // 把四個元素搬回 mainContent
            mainContent.appendChild(document.getElementById('class-title'));
            mainContent.appendChild(document.getElementById('teacher-title'));
            mainContent.appendChild(document.getElementById('schedule-table'));
            mainContent.appendChild(document.getElementById('teacher-schedule-table'));
            splitRow.remove();
        }
        // 根據 lastMode 顯示
        if (lastMode === 'class') {
            document.getElementById('teacher-title').style.display = 'none';
            document.getElementById('teacher-schedule-table').style.display = 'none';
            document.getElementById('class-title').style.display = 'block';
            document.getElementById('schedule-table').style.display = 'block';
        } else {
            document.getElementById('class-title').style.display = 'none';
            document.getElementById('schedule-table').style.display = 'none';
            document.getElementById('teacher-title').style.display = 'block';
            document.getElementById('teacher-schedule-table').style.display = 'block';
        }
    }

    // 節次時間表
    const periods = [
        { no: 1, time: "08:25-09:10", start: "08:25", end: "09:10" },
        { no: 2, time: "09:20-10:05", start: "09:20", end: "10:05" },
        { no: 3, time: "10:20-11:05", start: "10:20", end: "11:05" },
        { no: 4, time: "11:15-12:00", start: "11:15", end: "12:00" },
        { no: 5, time: "13:20-14:05", start: "13:20", end: "14:05" },
        { no: 6, time: "14:15-15:00", start: "14:15", end: "15:00" },
        { no: 7, time: "15:15-16:00", start: "15:15", end: "16:00" },
        { no: 8, time: "16:10-16:55", start: "16:10", end: "16:55" }
    ];

    // 顯示班級課表
    function showClassSchedule(cls) {
        currentCls = cls;
        lastMode = 'class';
        document.getElementById('class-title').innerText = cls.name + ' 課表';
        renderClassSchedule();
        if (!document.body.classList.contains('split-mode')) {
            document.getElementById('teacher-title').style.display = 'none';
            document.getElementById('teacher-schedule-table').style.display = 'none';
            document.getElementById('class-title').style.display = 'block';
            document.getElementById('schedule-table').style.display = 'block';
        }
    }
    function renderClassSchedule() {
        if (!currentCls) return;
        let table = `<table><thead><tr><th>節次/時間</th>`;
        const days = ['星期一','星期二','星期三','星期四','星期五'];
        days.forEach(day => table += `<th>${day}</th>`);
        table += '</tr></thead><tbody>';

        // 取得現在時間
        const now = new Date();
        const nowDay = now.getDay();
        const nowTime = now.getHours() * 60 + now.getMinutes();

        for (let period = 0; period < periods.length; period++) {
            let isCurrent = false;
            if (nowDay >= 1 && nowDay <= 5) {
                const [startH, startM] = periods[period].start.split(':').map(Number);
                const [endH, endM] = periods[period].end.split(':').map(Number);
                const startMin = startH * 60 + startM;
                const endMin = endH * 60 + endM;
                if (nowTime >= startMin && nowTime <= endMin) {
                    isCurrent = true;
                }
            }
            table += `<tr${isCurrent ? ' class="current-period"' : ''}><td>第${period+1}節<br><span style="font-size:0.95em;color:#888;">${periods[period].time}</span></td>`;
            for (let day = 0; day < 5; day++) {
                const subject = currentCls.schedule[day]?.[period]?.subject || '';
                const teacher = currentCls.schedule[day]?.[period]?.teacher || '';
                // 併排模式且導師名稱等於右側導師時加上 highlight
                let highlight = '';
                if (
                    document.body.classList.contains('split-mode') &&
                    currentTeacher && teacher === currentTeacher.name
                ) {
                    highlight = ' highlight-class';
                }
                table += `<td class="${highlight.trim()}">${subject}${subject && teacher ? '<br>' : ''}${teacher ? `<span class="teacher-link" data-teacher-name="${teacher}">${teacher}</span>` : ''}</td>`;
            }
            table += '</tr>';
        }
        table += '</tbody></table>';
        document.getElementById('schedule-table').innerHTML = table;
    }

    // 顯示導師課表
    function showTeacherSchedule(teacher) {
        currentTeacher = teacher;
        lastMode = 'teacher';
        document.getElementById('teacher-title').innerText = teacher.name + ' 課表';
        renderTeacherSchedule();
        if (!document.body.classList.contains('split-mode')) {
            document.getElementById('class-title').style.display = 'none';
            document.getElementById('schedule-table').style.display = 'none';
            document.getElementById('teacher-title').style.display = 'block';
            document.getElementById('teacher-schedule-table').style.display = 'block';
        }
    }
    function renderTeacherSchedule() {
        if (!currentTeacher) return;
        let table = `<table><thead><tr><th>節次/時間</th>`;
        const days = ['星期一','星期二','星期三','星期四','星期五'];
        days.forEach(day => table += `<th>${day}</th>`);
        table += '</tr></thead><tbody>';

        const now = new Date();
        const nowDay = now.getDay();
        const nowTime = now.getHours() * 60 + now.getMinutes();

        for (let period = 0; period < periods.length; period++) {
            let isCurrent = false;
            if (nowDay >= 1 && nowDay <= 5) {
                const [startH, startM] = periods[period].start.split(':').map(Number);
                const [endH, endM] = periods[period].end.split(':').map(Number);
                const startMin = startH * 60 + startM;
                const endMin = endH * 60 + endM;
                if (nowTime >= startMin && nowTime <= endMin) {
                    isCurrent = true;
                }
            }
            table += `<tr${isCurrent ? ' class="current-period"' : ''}><td>第${period+1}節<br><span style="font-size:0.95em;color:#888;">${periods[period].time}</span></td>`;
            for (let day = 0; day < 5; day++) {
                const subject = currentTeacher.schedule[day]?.[period]?.subject || '';
                const rawClassName = currentTeacher.schedule[day]?.[period]?.class || '';
                const className = convertClassName(rawClassName);
                let highlight = '';
                if (
                    document.body.classList.contains('split-mode') &&
                    currentCls && className === currentCls.name
                ) {
                    highlight = ' highlight-class';
                }
                table += `<td${className ? ` data-class-name="${className}"` : ''} class="${highlight.trim()}">${subject}${subject && className ? '<br>' : ''}${className ? `<span class="class-link" data-class-name="${className}">${className}</span>` : ''}</td>`;
            }
            table += '</tr>';
        }
        table += '</tbody></table>';
        document.getElementById('teacher-schedule-table').innerHTML = table;
    }

    // 點班級課表的導師（任何模式都可切換右側導師課表）
    document.getElementById('schedule-table').addEventListener('click', function(e) {
        let td = e.target.closest('td');
        if (!td) return;
        let teacherLink = td.querySelector('.teacher-link');
        if (teacherLink) {
            const teacherName = teacherLink.getAttribute('data-teacher-name');
            const teacher = teacherData.find(t => t.name === teacherName);
            if (teacher) showTeacherSchedule(teacher);
        }
    });

    // 點導師課表的班級（任何模式都可切換左側班級課表）
    document.getElementById('teacher-schedule-table').addEventListener('click', function(e) {
        let td = e.target.closest('td');
        if (!td) return;
        let classLink = td.querySelector('.class-link');
        let className = '';
        if (classLink) {
            className = classLink.getAttribute('data-class-name');
        }
        if (!className && td.hasAttribute('data-class-name')) {
            className = td.getAttribute('data-class-name');
        }
        if (className) {
            const cls = classData.find(c => c.name === className);
            if (cls) showClassSchedule(cls);
        }
    });

    // 每秒自動更新高亮
    setInterval(() => {
        renderClassSchedule();
        renderTeacherSchedule();
    }, 700);

    // 時鐘
    function updateClock() {
        const clock = document.getElementById('clock');
        const now = new Date();
        const pad = n => n.toString().padStart(2, '0');
        const week = ['Sun.', 'Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.'];
        clock.innerHTML = `<span class="clock-time">${pad(now.getHours())}:${pad(now.getMinutes())}</span>
    <span class="clock-date">${pad(now.getMonth()+1)}/${pad(now.getDate())} ${week[now.getDay()]}</span>`;
    }
    setInterval(updateClock, 1000);
    updateClock();

    // 主題切換
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('day-mode');
    });

    function convertClassName(code) {
        if (!/^\d{3}$/.test(code)) return code;
        const grade = code[0];
        const num = parseInt(code.slice(1), 10);
        return `${grade}年${num}班`;
    }
};