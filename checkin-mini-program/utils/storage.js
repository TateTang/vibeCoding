const { getDateOffset } = require("./checkin");

const STORAGE_KEY = "checkin_mini_program_data";

function createSeedData() {
  return {
    projects: [
      {
        id: "proj_001",
        name: "每天学习",
        target: 30,
        created_at: "2026-05-12T08:00:00+08:00"
      },
      {
        id: "proj_002",
        name: "晨跑计划",
        target: 21,
        created_at: "2026-05-10T07:30:00+08:00"
      },
      {
        id: "proj_003",
        name: "早睡挑战",
        target: 14,
        created_at: "2026-05-08T22:00:00+08:00"
      }
    ],
    records: [
      {
        id: "rec_001",
        project_id: "proj_001",
        date: getDateOffset(-4),
        note: "完成英语阅读",
        created_at: "2026-05-08T21:00:00+08:00"
      },
      {
        id: "rec_002",
        project_id: "proj_001",
        date: getDateOffset(-3),
        note: "刷了算法题",
        created_at: "2026-05-09T21:00:00+08:00"
      },
      {
        id: "rec_003",
        project_id: "proj_001",
        date: getDateOffset(-2),
        note: "看完一章课程",
        created_at: "2026-05-10T21:00:00+08:00"
      },
      {
        id: "rec_004",
        project_id: "proj_001",
        date: getDateOffset(-1),
        note: "整理学习笔记",
        created_at: "2026-05-11T21:00:00+08:00"
      },
      {
        id: "rec_005",
        project_id: "proj_001",
        date: getDateOffset(0),
        note: "完成 2 小时深度学习",
        created_at: "2026-05-12T21:00:00+08:00"
      },
      {
        id: "rec_006",
        project_id: "proj_002",
        date: getDateOffset(-3),
        note: "跑了 3 公里",
        created_at: "2026-05-09T06:30:00+08:00"
      },
      {
        id: "rec_007",
        project_id: "proj_002",
        date: getDateOffset(-2),
        note: "跑了 4 公里",
        created_at: "2026-05-10T06:30:00+08:00"
      },
      {
        id: "rec_008",
        project_id: "proj_002",
        date: getDateOffset(-1),
        note: "跑了 3.5 公里",
        created_at: "2026-05-11T06:30:00+08:00"
      },
      {
        id: "rec_009",
        project_id: "proj_003",
        date: getDateOffset(-5),
        note: "23:00 前入睡",
        created_at: "2026-05-07T23:05:00+08:00"
      },
      {
        id: "rec_010",
        project_id: "proj_003",
        date: getDateOffset(-1),
        note: "22:45 上床",
        created_at: "2026-05-11T22:45:00+08:00"
      }
    ]
  };
}

function ensureStorage() {
  const existing = wx.getStorageSync(STORAGE_KEY);

  if (!existing || !existing.projects || !existing.records) {
    const seedData = createSeedData();
    wx.setStorageSync(STORAGE_KEY, seedData);
    return seedData;
  }

  return existing;
}

function getData() {
  return ensureStorage();
}

function saveData(data) {
  wx.setStorageSync(STORAGE_KEY, data);
}

function getTodayText() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function hasCheckedInToday(projectId) {
  const data = getData();
  const today = getTodayText();

  return data.records.some((record) => (
    record.project_id === projectId && record.date === today
  ));
}

function addCheckinRecord(projectId, note) {
  const data = getData();
  const now = new Date();
  const today = getTodayText();

  const alreadyChecked = data.records.some((record) => (
    record.project_id === projectId && record.date === today
  ));

  if (alreadyChecked) {
    return {
      success: false,
      message: "今天已经打过卡了"
    };
  }

  data.records.unshift({
    id: `rec_${Date.now()}`,
    project_id: projectId,
    date: today,
    note: (note || "").trim(),
    created_at: now.toISOString()
  });

  saveData(data);

  return {
    success: true,
    message: "打卡成功"
  };
}

function deleteProject(projectId) {
  const data = getData();
  const nextProjects = data.projects.filter((project) => project.id !== projectId);

  if (nextProjects.length === data.projects.length) {
    return {
      success: false,
      message: "项目不存在"
    };
  }

  const nextRecords = data.records.filter((record) => record.project_id !== projectId);

  saveData({
    projects: nextProjects,
    records: nextRecords
  });

  return {
    success: true,
    message: "项目已删除"
  };
}

module.exports = {
  deleteProject,
  getData,
  hasCheckedInToday,
  saveData,
  addCheckinRecord
};
