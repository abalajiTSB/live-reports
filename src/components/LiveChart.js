import React, { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
import axios from "axios";
import dayjs from "dayjs";

const LiveChart = () => {
  const chartRef = useRef(null);
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/retrieve");
        setData(response.data.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      const chart = echarts.init(chartRef.current);

      const processData = (data) => {
        const groupedData = {};
        data.forEach((item) => {
          const date = dayjs(item.SentTime).format("YYYY-MM-DD");
          if (!groupedData[date]) {
            groupedData[date] = 0;
          }
          groupedData[date] += 1;
        });

        const sortedDates = Object.keys(groupedData).sort(
          (a, b) => new Date(a) - new Date(b)
        );
        const recentDates = sortedDates.slice(-4); // Get the last 4 days including today

        return recentDates.map((date) => ({
          name: date,
          value: groupedData[date],
        }));
      };

      const chartData = processData(data);

      const option = {
        title: {
          text: "Live Reports - Line Race Chart",
        },
        tooltip: {
          trigger: "axis",
        },
        xAxis: {
          type: "category",
          data: chartData.map((item) => item.name),
        },
        yAxis: {
          type: "value",
        },
        series: [
          {
            data: chartData.map((item) => item.value),
            type: "line",
          },
        ],
      };

      chart.setOption(option);

      const interval = setInterval(async () => {
        try {
          const response = await axios.get("http://127.0.0.1:8000/retrieve");
          setData(response.data.data);
          const updatedChartData = processData(response.data.data);
          chart.setOption({
            xAxis: {
              data: updatedChartData.map((item) => item.name),
            },
            series: [
              {
                data: updatedChartData.map((item) => item.value),
              },
            ],
          });
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      }, 5000); // Update every 5 seconds

      return () => {
        clearInterval(interval);
        chart.dispose();
      };
    }
  }, [data]);

  return <div ref={chartRef} style={{ width: "100%", height: "600px" }}></div>;
};

export default LiveChart;
