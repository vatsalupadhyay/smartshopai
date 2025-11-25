import { Doughnut, Pie, Bar } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend, ChartOptions, CategoryScale, LinearScale, BarElement } from 'chart.js';

Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

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

type BarProps = {
  labels: string[];
  values: number[];
  color?: string;
  label?: string;
};

export const BarChart: React.FC<BarProps> = ({ labels, values, color = '#3b82f6', label = 'Count' }) => {
  const data = {
    labels,
    datasets: [
      {
        label,
        data: values,
        backgroundColor: color,
        borderWidth: 0,
        borderRadius: 4,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context) => {
            const value = context.raw as number;
            return `${context.dataset.label}: ${value}`;
          }
        }
      }
    },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } },
      x: { grid: { display: false } }
    }
  };

  return <Bar data={data} options={options} />;
};

export default { DonutChart, PieChart, BarChart };

