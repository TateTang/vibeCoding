const { getProjectStats, getToday } = require("../../utils/checkin");
const { getData, hasCheckedInToday, addCheckinRecord } = require("../../utils/storage");

Page({
  data: {
    today: "",
    projects: []
  },

  onLoad() {
    this.setData({
      today: getToday()
    });
    this.loadProjects();
  },

  onShow() {
    this.loadProjects();
  },

  loadProjects() {
    const data = getData();
    const projects = data.projects.map((project) => {
      const stats = getProjectStats(project, data.records);

      return {
        ...project,
        ...stats
      };
    });

    this.setData({ projects });
  },

  handleOpenProject(event) {
    const { id } = event.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  },

  handleCheckIn(event) {
    const { id } = event.currentTarget.dataset;
    const alreadyChecked = hasCheckedInToday(id);

    if (alreadyChecked) {
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

        const result = addCheckinRecord(id, modalResult.content || "");

        wx.showToast({
          title: result.message,
          icon: result.success ? "success" : "none"
        });

        if (result.success) {
          this.loadProjects();
        }
      }
    });
  },

  handleAddProject() {
    wx.showToast({
      title: "下一步可以接创建项目页",
      icon: "none"
    });
  }
});
