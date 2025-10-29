/**
 * ECharts 柱状图组件
 * 用于展示对比数据
 */

'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface BarChartProps {
  data: {
    xAxis: string[];
    series: {
      name: string;
      data: number[];
      color?: string;
    }[];
  };
  title?: string;
  height?: number;
  horizontal?: boolean;
  yAxisFormatter?: (value: number) => string;
}

export function BarChart({ 
  data, 
  title, 
  height = 300,
  horizontal = false,
  yAxisFormatter, 
}: BarChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // 初始化图表
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    // 配置图表选项
    const option: echarts.EChartsOption = {
      title: title ? {
        text: title,
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'normal',
        },
      } : undefined,
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        formatter: (params: any) => {
          let result = `${params[0].axisValue}<br/>`;
          params.forEach((item: any) => {
            const value = yAxisFormatter 
              ? yAxisFormatter(item.value) 
              : item.value;
            result += `${item.marker} ${item.seriesName}: ${value}<br/>`;
          });
          return result;
        },
      },
      legend: {
        data: data.series.map(s => s.name),
        bottom: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: title ? '15%' : '10%',
        containLabel: true,
      },
      ...(horizontal ? {
        yAxis: {
          type: 'category',
          data: data.xAxis,
          axisLabel: {
            fontSize: 11,
          },
        },
        xAxis: {
          type: 'value',
          axisLabel: {
            formatter: yAxisFormatter || '{value}',
          },
        },
      } : {
        xAxis: {
          type: 'category',
          data: data.xAxis,
          axisLabel: {
            rotate: 45,
            fontSize: 11,
          },
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: yAxisFormatter || '{value}',
          },
        },
      }),
      series: data.series.map(s => ({
        name: s.name,
        type: 'bar',
        data: s.data,
        itemStyle: {
          color: s.color,
        },
        barMaxWidth: 50,
      })),
    };

    // 设置图表选项
    chartInstance.current.setOption(option);

    // 响应式调整
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, title, horizontal, yAxisFormatter]);

  // 组件卸载时销毁图表
  useEffect(() => {
    return () => {
      chartInstance.current?.dispose();
    };
  }, []);

  return <div ref={chartRef} style={{ width: '100%', height: `${height}px` }} />;
}

