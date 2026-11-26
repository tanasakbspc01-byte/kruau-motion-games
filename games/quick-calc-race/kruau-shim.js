/* KruAu: แทน claude.use("downloads") เมื่อเปิดนอก claude.ai ให้บันทึกไฟล์ผ่านเบราว์เซอร์ */
(function () {
  if (window.claude && window.claude.use) return;
  window.claude = window.claude || {};
  window.claude.use = function (name) {
    if (name !== "downloads") return Promise.reject(new Error("unsupported"));
    return Promise.resolve({ save: function (o) {
      var d = o.data, blob = d instanceof Blob ? d : new Blob([d]);
      var url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = o.filename || "file"; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
      return Promise.resolve();
    } });
  };
})();
