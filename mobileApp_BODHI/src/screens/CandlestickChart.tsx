import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export interface CandlestickData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface Props {
  data: CandlestickData[];
  height?: number;
}

export default function CandlestickChart({ data, height = 250 }: Props) {
  const htmlContent = useMemo(() => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <script src="https://unpkg.com/lightweight-charts@3.8.0/dist/lightweight-charts.standalone.production.js"></script>
      <style>
        body { margin: 0; padding: 0; background-color: #0E0C24; overflow: hidden; }
        #chart { width: 100vw; height: 100vh; }
      </style>
    </head>
    <body>
      <div id="chart"></div>
      <script>
        // Log errors back to React Native
        window.onerror = function(m) {
          window.ReactNativeWebView.postMessage(JSON.stringify({type: 'error', message: m}));
        };

        function init() {
          try {
            const chart = LightweightCharts.createChart(document.getElementById('chart'), {
              width: window.innerWidth,
              height: window.innerHeight,
              layout: { 
                backgroundColor: '#0E0C24', 
                textColor: 'rgba(255, 255, 255, 0.5)',
                fontSize: 10,
              },
              grid: { 
                vertLines: { color: 'rgba(255, 255, 255, 0.05)' }, 
                horzLines: { color: 'rgba(255, 255, 255, 0.05)' } 
              },
              timeScale: { borderColor: 'rgba(255, 255, 255, 0.1)' },
              rightPriceScale: { borderColor: 'rgba(255, 255, 255, 0.1)' },
              crosshair: { mode: 0 }
            });

            // 🟢 Support for v3 syntax
            const candleSeries = chart.addCandlestickSeries({
              upColor: '#C8FF00', 
              downColor: '#F43F5E',
              borderVisible: false, 
              wickUpColor: '#C8FF00', 
              wickDownColor: '#F43F5E',
            });

            const chartData = ${JSON.stringify(data)};
            if (chartData && chartData.length > 0) {
              candleSeries.setData(chartData);
              chart.timeScale().fitContent();
            }
          } catch (e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({type: 'error', message: e.message}));
          }
        }
        
        window.onload = init;
      </script>
    </body>
    </html>
  `, [data]);

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false}
        onMessage={(event) => {
          try {
            const msg = JSON.parse(event.nativeEvent.data);
            if (msg.type === 'error') console.log("📉 CHART ENGINE ERROR:", msg.message);
          } catch(e) {}
        }}
        style={{ backgroundColor: 'transparent' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#0E0C24',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
});