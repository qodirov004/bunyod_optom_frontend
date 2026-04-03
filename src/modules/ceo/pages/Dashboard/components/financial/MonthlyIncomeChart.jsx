import React, { useEffect, useRef } from 'react';
import { Card, Typography, Spin, Empty, Row, Col, Statistic } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, BarChartOutlined } from '@ant-design/icons';
import Chart from 'chart.js/auto';
import { formatCurrency } from '../../utils/formatters';

const { Title } = Typography;

const MonthlyIncomeChart = ({ monthlyData = [], isLoading = false }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Use data as-is (already in UZS from useFinancial hook)
  const filteredData = monthlyData;

  // Calculate totals
  const totalIncome = filteredData.reduce((sum, item) => sum + (item.daromad || 0), 0);
  const totalExpense = filteredData.reduce((sum, item) => sum + (item.xarajat || 0), 0);
  const totalBalance = totalIncome - totalExpense;

  useEffect(() => {
    if (isLoading || !filteredData.length || !chartRef.current) return;

    // Destroy existing chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Create gradients for visualization
    const balanceGradient = ctx.createLinearGradient(0, 0, 0, 400);
    balanceGradient.addColorStop(0, 'rgba(75, 192, 192, 0.4)');
    balanceGradient.addColorStop(1, 'rgba(75, 192, 192, 0)');

    // Create the chart
    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: filteredData.map(item => item.month),
        datasets: [
          {
            label: "Kirim (so'm)",
            data: filteredData.map(item => item.daromad || 0),
            backgroundColor: 'rgba(24, 144, 255, 0.7)',
            borderColor: '#1890ff',
            borderWidth: 1,
            borderRadius: 6,
            maxBarThickness: 35,
            order: 1
          },
          {
            label: "Chiqim (so'm)",
            data: filteredData.map(item => item.xarajat || 0),
            backgroundColor: 'rgba(255, 99, 132, 0.7)',
            borderColor: '#ff6384',
            borderWidth: 1,
            borderRadius: 6,
            maxBarThickness: 35,
            order: 2
          },
          {
            label: "Balans (so'm)",
            data: filteredData.map(item => item.foyda || 0),
            type: 'line',
            backgroundColor: balanceGradient,
            borderColor: '#4bc0c0',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: 'white',
            pointBorderColor: '#4bc0c0',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointHoverBackgroundColor: '#4bc0c0',
            pointHoverBorderColor: 'white',
            pointHoverBorderWidth: 2,
            order: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              usePointStyle: true,
              boxWidth: 10,
              boxHeight: 10,
              padding: 20,
              font: {
                size: 13,
                weight: '500'
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            titleColor: '#334155',
            bodyColor: '#334155',
            borderColor: '#e2e8f0',
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            usePointStyle: true,
            titleFont: {
              size: 14,
              weight: 'bold',
            },
            bodyFont: {
              size: 13,
            },
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                const value = context.raw;
                return `${context.dataset.label}: ${formatCurrency(value)} so'm`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(240, 242, 245, 0.7)',
              display: true,
              drawBorder: false,
            },
            border: {
              display: false
            },
            ticks: {
              callback: function(value) {
                if (value >= 1000000000) {
                  return (value / 1000000000).toFixed(1) + ' mlrd';
                } else if (value >= 1000000) {
                  return (value / 1000000).toFixed(1) + ' mln';
                } else if (value >= 1000) {
                  return (value / 1000).toFixed(0) + ' ming';
                }
                return value.toLocaleString();
              },
              color: '#64748b',
              padding: 10,
              font: {
                size: 12,
                weight: '500'
              }
            },
          },
          x: {
            grid: {
              display: false,
              drawBorder: false,
            },
            border: {
              display: false
            },
            ticks: {
              color: '#64748b',
              padding: 10,
              font: {
                size: 13,
                weight: '500'
              }
            },
          },
        },
        animations: {
          tension: {
            duration: 1000,
            easing: 'easeOutQuad',
          },
          y: {
            duration: 1000,
            from: 0
          }
        },
        layout: {
          padding: {
            top: 20,
            right: 20,
            bottom: 10,
            left: 10
          }
        }
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [filteredData, isLoading]);

  // Calculate percentage changes
  const getPercentageChange = (currentValue, previousValue) => {
    if (!previousValue) return { value: 0, isPositive: true };
    
    const change = ((currentValue - previousValue) / previousValue) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      isPositive: change >= 0
    };
  };

  const lastMonth = filteredData[filteredData.length - 1] || { daromad: 0, xarajat: 0, foyda: 0 };
  const previousMonth = filteredData[filteredData.length - 2] || { daromad: 0, xarajat: 0, foyda: 0 };
  
  const incomeChange = getPercentageChange(lastMonth.daromad, previousMonth.daromad);
  const expenseChange = getPercentageChange(lastMonth.xarajat, previousMonth.xarajat);
  const balanceChange = getPercentageChange(lastMonth.foyda, previousMonth.foyda);

  if (isLoading) {
    return (
      <div className="dashboard-section">
        <div className="section-header">
          <Title level={4}><BarChartOutlined /> 6 oylik moliyaviy ko'rsatkichlar</Title>
        </div>
        <Card className="dashboard-card monthly-income-card">
          <div className="monthly-chart-container loading">
            <Spin size="large" />
          </div>
        </Card>
      </div>
    );
  }

  if (!filteredData.length) {
    return (
      <div className="dashboard-section">
        <div className="section-header">
          <Title level={4}><BarChartOutlined /> 6 oylik moliyaviy ko'rsatkichlar</Title>
        </div>
        <Card className="dashboard-card monthly-income-card">
          <div className="monthly-chart-container empty">
            <Empty description="Ma'lumot topilmadi" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="dashboard-section">
      <div className="section-header">
        <Title level={4}><BarChartOutlined /> 6 oylik moliyaviy ko'rsatkichlar</Title>
      </div>
      <Card className="dashboard-card monthly-income-card">
        <Row gutter={[24, 24]} className="statistics-row">
          <Col xs={24} md={8}>
            <Statistic
              title="Jami kirim (so'm)"
              value={formatCurrency(totalIncome)}
              valueStyle={{ color: '#1890ff', fontSize: '22px' }}
              suffix={
                <span className={`percentage-change ${incomeChange.isPositive ? 'percentage-up' : 'percentage-down'}`}>
                  {incomeChange.isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  {incomeChange.value}%
                </span>
              }
            />
          </Col>
          <Col xs={24} md={8}>
            <Statistic
              title="Jami chiqim (so'm)"
              value={formatCurrency(totalExpense)}
              valueStyle={{ color: '#ff6384', fontSize: '22px' }}
              suffix={
                <span className={`percentage-change ${!expenseChange.isPositive ? 'percentage-up' : 'percentage-down'}`}>
                  {!expenseChange.isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  {expenseChange.value}%
                </span>
              }
            />
          </Col>
          <Col xs={24} md={8}>
            <Statistic
              title="Jami balans (so'm)"
              value={formatCurrency(totalBalance)}
              valueStyle={{ 
                color: totalBalance >= 0 ? '#4bc0c0' : '#ff6384', 
                fontSize: '22px' 
              }}
              suffix={
                <span className={`percentage-change ${balanceChange.isPositive ? 'percentage-up' : 'percentage-down'}`}>
                  {balanceChange.isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  {balanceChange.value}%
                </span>
              }
            />
          </Col>
        </Row>
        
        <div className="chart-container" style={{ height: "400px", marginTop: "20px" }}>
          <canvas ref={chartRef}></canvas>
        </div>
      </Card>

      <style jsx global>{`
        .monthly-chart-container.loading,
        .monthly-chart-container.empty {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 400px;
        }
        
        .monthly-income-card {
          margin-bottom: 24px;
          overflow: hidden;
        }
        
        .statistics-row {
          margin-bottom: 20px;
        }
        
        .chart-container {
          position: relative;
        }
        
        .percentage-change {
          font-size: 13px;
          margin-left: 10px;
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.04);
        }
        
        .percentage-up {
          color: #52c41a;
        }
        
        .percentage-down {
          color: #f5222d;
        }
        
        .percentage-change .anticon {
          margin-right: 4px;
        }
      `}</style>
    </div>
  );
};

export default MonthlyIncomeChart;