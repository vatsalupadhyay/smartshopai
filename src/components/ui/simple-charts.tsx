import { Doughnut, Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend, ChartOptions } from 'chart.js';

Chart.register(ArcElement, Tooltip, Legend);

// Global styling tweaks
Chart.defaults.font.family = 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial';
Chart.defaults.color = '#374151'; // tailwind gray-700

type DonutProps = {
  percentage: number;
  color?: string;
  label?: string;
};

export const DonutChart: React.FC<DonutProps> = ({ percentage, color = '#10b981', label }) => {
  const data = {
    labels: [label ?? 'Value', 'Remaining'],
    datasets: [
      {
        data: [percentage, 100 - percentage],
        backgroundColor: [color, '#e5e7eb'],
        borderWidth: 0,
      },
    ],
  };

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context) => {
            const label = context.label ?? '';
            const value = context.raw as number;
            return `${label}: ${value}%`;
          }
        }
      }
    },
    cutout: '70%'
  };

  return <Doughnut data={data} options={options} />;
};

type PieProps = {
  labels: string[];
  values: number[];
  colors?: string[];
};

export const PieChart: React.FC<PieProps> = ({ labels, values, colors }) => {
  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors ?? ['#10b981', '#ef4444', '#f59e0b'],
        borderWidth: 0,
      },
    ],
  };

  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { boxWidth: 12 } },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context) => {
            const label = context.label ?? '';
            const value = context.raw as number;
            const sum = (context.dataset.data as number[]).reduce((a,b)=> a + (Number(b) || 0), 0);
            const pct = sum ? Math.round((Number(value) / sum) * 100) : 0;
            return `${label}: ${value} (${pct}%)`;
          }
        }
      }
    }
  };

  return <Pie data={data} options={options} />;
};

export default { DonutChart, PieChart };

