const {
  buildCalendarDays,
  getMonthKey,
  getMonthLabel,
  getProjectStats,
  getToday,
  shiftMonth
} = require("../../utils/checkin");
const {
  addCheckinRecord,
  deleteProject,
  getData,
  hasCheckedInToday
} = require("../../utils/storage");

function formatDateTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

Page({
  data: {
    project: null,
    records: [],
    calendarDays: [],
    monthLabel: "",
    selectedDateInfo: null,
    weekLabels: ["日", "一", "二", "三", "四", "五", "六"]
  },

  onLoad(options) {
    this.projectId = options.id;
    const now = new Date();
    this.currentView = {
      year: now.getFullYear(),
      month: now.getMonth() + 1
    };
    this.loadDetail();
  },

  onShow() {
    this.loadDetail();
  },

  loadDetail() {
    if (!this.projectId) {
      return;
    }

    const data = getData();
    const project = data.projects.find((item) => item.id === this.projectId);

    if (!project) {
      this.setData({
        project: null,
        records: [],
        calendarDays: [],
        monthLabel: ""
      });
      return;
    }

    const projectRecords = data.records
      .filter((record) => record.project_id === this.projectId)
      .sort((left, right) => {
        const dateCompare = right.date.localeCompare(left.date);

        if (dateCompare !== 0) {
          return dateCompare;
        }

        return right.created_at.localeCompare(left.created_at);
      });

    const recordMap = projectRecords.reduce((accumulator, record) => {
      accumulator[record.date] = record;
      return accumulator;
    }, {});
    const checkedDates = Object.keys(recordMap);
    const calendarDays = buildCalendarDays(
      this.currentView.year,
      this.currentView.month,
      checkedDates
    ).map((day) => ({
      ...day,
      note: recordMap[day.date] ? recordMap[day.date].note : "",
      hasRecord: Boolean(recordMap[day.date])
    }));

    const selectedDateInfo = this.getSelectedDateInfo(calendarDays, recordMap);
    const stats = getProjectStats(project, data.records);

    this.setData({
      project: {
        ...project,
        ...stats,
        checkedToday: hasCheckedInToday(project.id),
        completionRateText: `${Math.round(stats.completionRate * 100)}%`
      },
      records: projectRecords.map((record) => ({
        ...record,
        created_at_text: formatDateTime(record.created_at)
      })),
      calendarDays,
      monthLabel: getMonthLabel(this.currentView.year, this.currentView.month),
      monthKey: getMonthKey(this.currentView.year, this.currentView.month),
      selectedDateInfo
    });
  },

  getSelectedDateInfo(calendarDays, recordMap) {
    const selectedDate = this.data.selectedDateInfo && this.data.selectedDateInfo.date;
    const matchedDay = calendarDays.find((day) => day.date === selectedDate);
    const today = getToday();
    const todayInView = calendarDays.find((day) => day.date === today && day.isCurrentMonth);
    const firstCheckedInView = calendarDays.find((day) => day.isCurrentMonth && day.isChecked);
    const firstCurrentMonthDay = calendarDays.find((day) => day.isCurrentMonth);
    const targetDay = matchedDay || todayInView || firstCheckedInView || firstCurrentMonthDay || calendarDays[0];

    if (!targetDay) {
      return null;
    }

    const record = recordMap[targetDay.date];

    return {
      date: targetDay.date,
      isChecked: Boolean(record),
      note: record && record.note ? record.note : "",
      createdAtText: record ? formatDateTime(record.created_at) : ""
    };
  },

  handlePreviousMonth() {
    this.currentView = shiftMonth(this.currentView.year, this.currentView.month, -1);
    this.loadDetail();
  },

  handleNextMonth() {
    this.currentView = shiftMonth(this.currentView.year, this.currentView.month, 1);
    this.loadDetail();
  },

  handleCheckIn() {
    if (!this.data.project) {
      return;
    }

    if (hasCheckedInToday(this.data.project.id)) {
      wx.showToast({
        title: "今天已经打过卡了",
        icon: "none"
      });
      return;
    }

    wx.showModal({
      title: "今日打卡",
      editable: true,
      placeholderText: "写一句备注，可不填",
      confirmText: "确认打卡",
      success: (modalResult) => {
        if (!modalResult.confirm) {
          return;
        }

        const result = addCheckinRecord(this.data.project.id, modalResult.content || "");

        wx.showToast({
          title: result.message,
          icon: result.success ? "success" : "none"
        });

        if (result.success) {
          this.loadDetail();
        }
      }
    });
  },

  handleSelectDate(event) {
    const { date } = event.currentTarget.dataset;

    if (!date) {
      return;
    }

    const record = this.data.records.find((item) => item.date === date);

    this.setData({
      selectedDateInfo: {
        date,
        isChecked: Boolean(record),
        note: record && record.note ? record.note : "",
        createdAtText: record ? record.created_at_text : ""
      }
    });
  },

  handleDeleteProject() {
    if (!this.projectId) {
      return;
    }

    wx.showModal({
      title: "删除项目",
      content: "删除后该项目和全部打卡记录都会被清空，确认删除吗？",
      confirmColor: "#c2410c",
      success: (modalResult) => {
        if (!modalResult.confirm) {
          return;
        }

        const result = deleteProject(this.projectId);

        wx.showToast({
          title: result.message,
          icon: result.success ? "success" : "none"
        });

        if (!result.success) {
          return;
        }

        setTimeout(() => {
          if (getCurrentPages().length > 1) {
            wx.navigateBack();
            return;
          }

          wx.reLaunch({
            url: "/pages/index/index"
          });
        }, 250);
      }
    });
  }
});
