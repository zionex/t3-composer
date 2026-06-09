import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  IconButton,
  Divider,
  CardHeader,
} from "@mui/material";

import {
  Edit as EditIcon,
  Delete as DeleteIcon} from "@mui/icons-material";

import { GridContainer, GridItem } from "../GridContainer";
import {isDeepEqual,isDate,isNumeric,stratifiedSampling} from "../../utils/utils";


export function detectColumnTypes(columnDefs, rowData){

    return new Promise((resolve, reject) => {
     
      const dateColumns = [];
      const numericColumns = [];

      if(!columnDefs || columnDefs.length ==0 || !rowData || rowData.length ==0){
        reject(new Error("columnDefs정보와 rowData가 있어야 합니다."))
        return
      }

      columnDefs.forEach(col => {
        const fieldName = col.field;
        const cellDataType = col.cellDataType;

        if (cellDataType === "boolean" || cellDataType === "object" ) 
          return

        if (cellDataType === "date") {
          dateColumns.push(fieldName);
        }
        else if (cellDataType === "number") {
          numericColumns.push(fieldName);
        }
        else if(cellDataType =="text") {
          
        }
        else {

          // cellDataType이 없는 경우 데이터를 확인해보자.
          
          const sampleSize = 100; // 샘플링 크기
          const sampledData = stratifiedSampling(rowData, sampleSize); // 샘플링
          // 샘플링된 데이터가 모두 특정 타입인지 확인하는 함수
          const isAllDates = sampledData.every(row => {
            const sampleValue = row[fieldName];
            return sampleValue != null && isDate(sampleValue);
          });

          const isAllNumeric = sampledData.every(row => {
            const sampleValue = row[fieldName];
            return sampleValue != null && isNumeric(sampleValue);
          });
          
          // 결과에 따라 컬럼 분류
          if (isAllDates) {
            dateColumns.push(fieldName);
          } else if (isAllNumeric) {
            numericColumns.push(fieldName);
          }
        }
      });

      const nonNumericColumns=columnDefs.filter(col=> numericColumns.indexOf(col.field) < 0).map(col=> col.field)

      resolve([dateColumns, numericColumns, nonNumericColumns])
    });
}

export const createInitialDataset=(dateColumns,numericColumns,nonNumericColumns) =>{
  return new Promise((resolve, reject) => {
    
    if (numericColumns.length === 0) {
      reject(new Error("숫자 칼럼이 없습니다."));
      return;
    }

    const xAxisColumns = dateColumns.length > 0 ? dateColumns : nonNumericColumns;

    if (xAxisColumns.length === 0) {
      reject(new Error("날짜나 비숫자 칼럼이 없습니다."));
      return;
    }

    const initialDatasets = [];
    xAxisColumns.forEach(xAxis => {
      numericColumns.forEach(yAxis => {
        initialDatasets.push({
          xAxis,
          yAxis,
          chartType: "line"
        });
      });
    });

    resolve(initialDatasets);
  });
}

export const createChartOptions=(dsOptions, dateColumns ,rowData)=>{

  if (!rowData || rowData.length === 0 || dsOptions.length === 0) {
    return;
  }

  //TODO: 라벨을 dsOptions 의 xAxis 개수만큼 만들어야 한다.
  const labels  = rowData.map((row) => {
    const xColsNm = dsOptions[0].xAxis
    const value = row[xColsNm];
    let value2 = value
    if(dateColumns.includes(xColsNm)) {
      value2 = new Date(value);
      return !isNaN(value2) ? value2.toLocaleDateString() : value;
    }
    else
      return value2
  });

  const getXValue=(xColsNm, value)=>{
    let value2 = value
    if(dateColumns.includes(xColsNm)) {
      value2 = new Date(value);
      return !isNaN(value2) ? value2.toLocaleDateString() : value;
    }
    else
      return value2
  }

  const datasets = dsOptions.map((meta, index) =>{
    const xColsNm = meta.xAxis
    return ({
      label: meta.yAxis,
      // data: rowData.map((row) =>({x: getXValue(xColsNm, row[xColsNm]), y:row[meta.yAxis]})),
      data: rowData.map((row) =>(row[meta.yAxis])),
      borderColor: `hsla(${index * 360/dsOptions.length}, 70%, 50%, 1)`,
      borderWidth: 1,
      pointRadius: 0, // 꼭지점 숨기기
      radius: 0,
      type: meta.chartType
    })
  });

  const config = {
    type: 'line',
    data: {
      labels,
      datasets,
    },
    options: {
      // parsing: false, 
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        datalabels: false, 
        legend: {
          position: "top",
        },
        // decimation: {
        //   enabled: true,
        //   algorithm: 'lttb', // Largest Triangle Three Buckets 알고리즘 적용
        //   samples: 500 // 최종 샘플링된 데이터 포인트 수
        // },
        zoom: {
          pan: {
            enabled: true,
            mode: 'xy',
          },
          zoom: {
            wheel: {
              enabled: true,
            },
            pinch: {
              enabled: true
            },
            mode: 'xy',
          }
        }
      },
      scales: {
        x: {
          // type: 'linear',
          ticks: {
            source: 'auto',
            autoSkip: true,
            maxTicksLimit: 20
          }
        },
        y: {
          type: 'logarithmic', //로그 값 처리(예를 들어 중간값 생략이 가능)
        }
      }
    },
  };

  console.log(config)
  return config
}

function ChartPropSetting({chartOption, dataSet, columnDefs, rowData, handleDataSetUpdate, handleChartUpdate, ...props}) {

  const [datasetOptions, setDatasetOptions] = useState(dataSet || [])

  const [editDataset, setEditDataset] = useState(null)

  const [xAxis, setXAxis] = useState("")
  const [yAxis, setYAxis] = useState("")
  const [chartType, setChartType] = useState("line")

  const [dateColumns, setDateColumns] = useState([])
  const [numericColumns, setNumericColumns] = useState([])
  const [nonNumericColumns, setNonNumericColumns] = useState([])
  
  useEffect(()=>{
    // 날짜 칼럼 타입과 숫자 칼럼타입을 찾아서 각각(x, y)축을 구성한 데이터 셋틀 만든다.
    if(columnDefs && columnDefs.length > 0 && rowData && rowData.length > 0) {
      detectColumnTypes(columnDefs, rowData).then(res=>{
        const [dateColumns, numericColumns, nonNumericColumns] = res
        setDateColumns(dateColumns)
        setNumericColumns(numericColumns)
        setNonNumericColumns(nonNumericColumns)
      })
    }
  },[columnDefs, rowData])

  useEffect(()=>{
    if(datasetOptions && datasetOptions.length > 0 && isDeepEqual(datasetOptions, dataSet)==false) {

      if(handleDataSetUpdate)
        handleDataSetUpdate(datasetOptions)

      const chartOptions=createChartOptions(datasetOptions,dateColumns, rowData)
      if(handleChartUpdate)
        handleChartUpdate(chartOptions)
    }
  },[datasetOptions])


  const handleDatesetAdd = (e) => {
    e.preventDefault();
    if (!xAxis || !yAxis || !chartType) {
      alert("Please fill out all fields.");
      return;
    }
    const editingDs= { xAxis, yAxis, chartType };
    
    const existds = datasetOptions.find(ds=> ds.xAxis == xAxis && ds.yAxis == yAxis && ds.chartType == chartType)
    if(existds) {
      alert("이미 존재하는 dataset입니다");
      return
    }

    setDatasetOptions([...datasetOptions, editingDs])
  }

  const handleDatasetDelete = (index) => {
    const dsOpt = datasetOptions.filter((_, i) => i !== index)
    setDatasetOptions(dsOpt)
    setEditDataset(null)
  }

  const handleDatasetEdit = (index) => {
    const dataset = datasetOptions[index];

    setEditDataset({
      xAxis: dataset.xAxis,
      yAxis: dataset.yAxis,
      chartType: dataset.chartType,
      editingIndex: index
    });

    setXAxis(dataset.xAxis)
    setYAxis(dataset.yAxis)
    setChartType(dataset.chartType)
  };

const handleEditSubmit = (e) => {
    e.preventDefault();

    editDataset.xAxis = xAxis
    editDataset.yAxis = yAxis
    editDataset.chartType = chartType

    const { editingIndex } = editDataset;

    const updatedDs = { xAxis:editDataset.xAxis, yAxis:editDataset.yAxis, chartType:editDataset.chartType}
    // 같은 넘이 있으면 패쓰
    const existds=datasetOptions.find((ds, index) =>
      index != editingIndex && ds.xAxis == updatedDs.xAxis && ds.yAxis == updatedDs.yAxis && ds.chartType == updatedDs.chartType
    )
    if(existds) {
      alert("이미 존재하는 dataset입니다");
      return
    }

    const dsOptions=datasetOptions.map((dataset, index) =>
      index === editingIndex ? updatedDs : dataset
    )

    setDatasetOptions(dsOptions)
    setEditDataset(null)
  };

  const cancelEdit=()=>{
    setXAxis("")
    setYAxis("")
    setChartType("line")
    setEditDataset(null)
  }
  
  return (
    <Paper sx={{ p: 2 }}>
          <Typography variant="h5" gutterBottom>
            Dataset Configuration
          </Typography>
          
          <form onSubmit={editDataset !== null ? handleEditSubmit : handleDatesetAdd}>
            <GridContainer spacing={3}>
              <GridItem xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>X Axis</InputLabel>
                  <Select
                    value={xAxis}
                    label="X Axis"
                    onChange={(e) => setXAxis(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>X축 칼럼선택</em>
                    </MenuItem>
                    {nonNumericColumns.map((field) => (
                      <MenuItem key={field} value={field}>
                        {field}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </GridItem>

              <GridItem xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Y Axis</InputLabel>
                  <Select
                    value={yAxis}
                    label="Y Axis"
                    onChange={(e) => setYAxis(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Y축 칼럼선택</em>
                    </MenuItem>
                    {numericColumns.map((field) => (
                      <MenuItem key={field} value={field}>
                        {field}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </GridItem>

              <GridItem xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Chart Type</InputLabel>
                  <Select
                    value={chartType}
                    label="Chart Type"
                    onChange={(e) => setChartType(e.target.value)}
                  >
                    <MenuItem value="bar">Bar</MenuItem>
                    <MenuItem value="line">Line</MenuItem>
                    <MenuItem value="pie">Pie</MenuItem>
                    <MenuItem value="scatter">Scatter</MenuItem>
                    
                  </Select>
                </FormControl>
              </GridItem>

              <GridItem xs={12}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                  >
                    {editDataset !== null ? 'Update Dataset' : 'Add Dataset'}
                  </Button>
                  {editDataset !== null && (
                    <Button
                      variant="outlined"
                      onClick={() => cancelEdit()}
                    >
                      Cancel Edit
                    </Button>
                  )}
                </Box>
              </GridItem>
            </GridContainer>
          </form>
          {/* <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Visualization Controls
            </Typography>
            <GridContainer spacing={2} alignItems="center">
              <GridItem xs={12} md={6}>
                <Typography gutterBottom>
                  Label Display Density
                </Typography>
                <Slider
                  value={labelDisplayCount}
                  onChange={this.handleLabelDisplayCountChange}
                  min={5}
                  max={50}
                  step={5}
                  marks
                  valueLabelDisplay="auto"
                />
              </GridItem>
            </GridContainer>
          </Box> */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              데이터 셋
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <GridContainer
                sx={{
                  maxHeight: '400px', // 높이 제한
                  overflowY: 'auto',  // 수직 스크롤
                  overflowX: 'hidden' // 가로 스크롤 비활성화
                }}
                spacing={2}
              >
              {datasetOptions.map((dataset, index) => (
                <GridItem xs={12} md={6} key={index}>
                  <Card variant="outlined">
                    <CardHeader 
                      action={
                        <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleDatasetEdit(index)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDatasetDelete(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                      }
                    />
                    <CardContent>
                      <Typography variant="body1">
                        X: {dataset.xAxis} Y: {dataset.yAxis} Type: {dataset.chartType}
                      </Typography>                      
                    </CardContent>
                  </Card>
                </GridItem>
              ))}
            </GridContainer>
          </Box>
        </Paper>
  )
}

export default ChartPropSetting;