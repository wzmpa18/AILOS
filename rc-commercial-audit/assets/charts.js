(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();

  var chart1 = echarts.init(document.getElementById('chart-radar'), null, { renderer: 'svg' });
  chart1.setOption({
    animation: false,
    radar: {
      center: ['50%', '50%'],
      radius: '65%',
      indicator: [
        { name: '产品认知传达', max: 100 },
        { name: 'AI差异化展示', max: 100 },
        { name: '新用户转化路径', max: 100 },
        { name: '多角色生态覆盖', max: 100 },
        { name: '技术基础设施', max: 100 },
        { name: '语言架构实现', max: 100 }
      ],
      axisName: { color: muted, fontSize: 11 },
      splitArea: { areaStyle: { color: ['transparent'] } },
      splitLine: { lineStyle: { color: rule } },
      axisLine: { lineStyle: { color: rule } }
    },
    series: [{
      type: 'radar',
      data: [{
        value: [15, 25, 30, 20, 40, 35],
        name: 'AILOS v3.2.2',
        areaStyle: { color: accent + '33' },
        lineStyle: { color: accent, width: 2 },
        itemStyle: { color: accent },
        symbol: 'circle',
        symbolSize: 6
      }, {
        value: [80, 90, 85, 75, 85, 80],
        name: '蓝图目标 (Milestone 3)',
        areaStyle: { color: accent2 + '22' },
        lineStyle: { color: accent2, width: 1.5, type: 'dashed' },
        itemStyle: { color: accent2 },
        symbol: 'diamond',
        symbolSize: 5
      }]
    }],
    tooltip: { appendToBody: true }
  });
  window.addEventListener('resize', function() { chart1.resize(); });
})();