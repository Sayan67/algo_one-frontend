import { useEffect, useState } from 'react'
import './App.css'
import { Button } from './components/ui/button'
import axios from 'axios'
import { useMemo } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import { Box, MenuItem, Select } from '@mui/material';
import { Slider } from "@/components/ui/slider"
import CircularProgress from '@mui/material/CircularProgress';

type Api_resposne = {
  strike: number;
  percent_in_out_money: number;
  percent_max_risk: number;
  percent_cost_to_insure: number;
  sigma_break_even: number;
  percent_to_dbl: number;
  prob_above: number;
  opt_mid_price: number;
  percent_ask_time_value: number;
  delta: number;
  opt_open_int: number;
  black_scholes_ratio_siv: number;
  black_scholes_ratio_50_day: number;
  iv_hv: number;
  percent_bid_ask_spread: number;
  percent_return_1_sigma_max_risk: number;
}[]

function App() {
  const [data, setData] = useState<Api_resposne>([]);
  const [slider, setSlider] = useState(10);
  const [tableData, setTableData] = useState<Api_resposne>([]);
  const [max, setMax] = useState<number | undefined>(undefined);
  const [sliderValueShow, setSliderValueShow] = useState<number>(10);
  const [showTooltip, setShowTooltip] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [customFiltered, setCustomFiltered] = useState<Api_resposne>([]);
  const threshold = 214.29;

  const customFilteredData = (allData: Api_resposne) => allData.filter((row) => {
    if (filterType === 'In') {
      return row.percent_in_out_money >= 0;
    } else if (filterType === 'Out') {
      return row.percent_in_out_money < 0;
    } else {
      return true;
    }
  });

  const filterData = (data: Api_resposne, sliderValue: number) => {

    if (sliderValue === 0) { return [] }
    else {
      const sortedData = [...data].sort((a, b) => a.strike - b.strike);

      const greaterThanThreshold = sortedData.filter((row) => row.strike > threshold);

      const lessThanOrEqualToThreshold = sortedData.filter((row) => row.strike <= threshold);

      const halfRowsToShow = Math.floor(sliderValue / 2);

      let greaterRows = [];
      let smallerRows = [];

      if (lessThanOrEqualToThreshold.length >= halfRowsToShow) {
        smallerRows = lessThanOrEqualToThreshold.slice(-halfRowsToShow);
        greaterRows = sliderValue % 2 === 0 ? greaterThanThreshold.slice(0,halfRowsToShow) : greaterThanThreshold.slice(0,halfRowsToShow +1);
      } else {
        greaterRows = greaterThanThreshold.slice(0, slider - lessThanOrEqualToThreshold.length);
        smallerRows = lessThanOrEqualToThreshold;
      }

      return [...smallerRows, ...greaterRows];
    }
  };
  useEffect(() => {
    async function getData() {
      try {
        const res = await axios.get('https://frontendassignment-algo-one.netlify.app/table_data') as { data: Api_resposne };
        setData(res.data);
        const max = Math.max(...res.data.map((item) => item.percent_return_1_sigma_max_risk));
        setMax(max);
        setLoading(false);
      } catch (error) {
        console.log(error);
      }
    }
    getData()
  }, [])

  useEffect(() => {
    const newFilteredData = filterData(data, 10);
    const newData = customFilteredData(newFilteredData)
    // console.log(newData);
    setCustomFiltered(newData);
    setTableData(newData);
  }, [data]);

  useEffect(() => {
    const newFilteredData = filterData(data, slider);
    const newData = customFilteredData(newFilteredData)
    setCustomFiltered(newData);
    setTableData(newData);
    // setTableData(newFilteredData);
  }, [slider]);

  useEffect(() => {
    // const newFilteredData= filterData(tableData,slider);
    const newData = customFilteredData(customFiltered)
    setTableData(newData);
  }, [filterType]);

  const handleMouseEnter = () => setShowTooltip(true);
  const handleMouseLeave = () => setShowTooltip(false);

  function handleCommit(val: number) {
    // console.log(val);
    setSlider(val);
  }
  function handleChange(num: number) {
    setSliderValueShow(num);
  }

  return (
    <>
      <div className='p-8'>
        <div className='flex flex-col items-center w-fit relative'>

          <div className='flex gap-4'>
            <h1>0</h1>
            <Slider
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onValueChange={(e) => handleChange(e[0])}
              onValueCommit={(e) => handleCommit(e[0])}
              defaultValue={[slider]} max={30} step={1} className='w-40'
            />
            {showTooltip && (
              <div
                className="absolute -top-8 left-0 transform translate-x-1/2 bg-black text-white px-2 py-1 rounded"
                style={{ left: `${sliderValueShow}%` }} // You can adjust this to place tooltip above thumb
              >
                {sliderValueShow}
              </div>
            )}
            <h1>30</h1>
          </div>
        </div>
        {max && !loading ?
          <Table data={tableData} max={max} filterType={filterType} setFilterType={setFilterType} />
          :
          <div className='flex justify-center items-center h-[500px]'>
            <CircularProgress />
          </div>
        }
      </div>
    </>
  )
}

function Table({ data, max, filterType, setFilterType }: { data: Api_resposne, max: number, filterType: string, setFilterType: (filter: string) => void }) {

  const CustomFilter = () => {
    return (
      <Select
        defaultValue='All'
        // value={filterType}
        onChange={(e) => {
          // console.log(e.target.value);
          setFilterType(e.target.value)
        }}
        sx={{ color: '#ffffff', border: '1px solid #ffffff', borderRadius: '5px' }}
      >
        <MenuItem value="All">All</MenuItem>
        <MenuItem value="In">In</MenuItem>
        <MenuItem value="Out">Out</MenuItem>
      </Select>
    );
  };

  const columns = useMemo<MRT_ColumnDef<Api_resposne>[]>(
    () => [
      {
        accessorKey: 'strike',
        header: 'Strike',
        muiTableHeadCellProps: {
          style: {
            backgroundColor: '#0F172A',
            color: '#ffffff',
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'space-between'
          }
        },
        Header: ({ column }) => <div className='h-full flex flex-col justify-between'>{column.columnDef.header}</div>,
      },
      {
        accessorKey: 'percent_in_out_money',
        header: '% In/Out Money',
        Filter: CustomFilter,
        Header: ({ column }) => <div className='text-white '>{column.columnDef.header}</div>,
        Cell: ({ cell }) => {
          const value = cell.getValue<number>();
          let backgroundColor = '';
          if (value > 0) {
            backgroundColor = 'rgba(255, 165, 0, 0.3)';
          } else {
            backgroundColor = '#FFFBD6';
          }

          return (
            <div
              className=' relative h-8 flex items-center justify-end'
            >
              <h1 className='z-[1]'>
                {value}
              </h1>
              <Box
                sx={{ backgroundColor }}
                className={`absolute left-0 h-full -z-[1] top-1/2 -translate-y-1/2 w-full`}
              ></Box>
            </div>
          );
        },
      },
      {
        accessorKey: 'percent_max_risk',
        header: '% Max Risk',
        Header: ({ column }) => <div className='text-white '>{column.columnDef.header}</div>,
      },
      {
        accessorKey: 'percent_cost_to_insure',
        header: '% Cost to Insure',
        Header: ({ column }) => <div className='text-white '>{column.columnDef.header}</div>,
      },
      {
        accessorKey: 'sigma_break_even',
        header: 'Sigma Break Even',
        Header: ({ column }) => <div className='text-white '>{column.columnDef.header}</div>,
      },
      {
        accessorKey: 'percent_to_dbl',
        header: '% to Double',
        Header: ({ column }) => <div className='text-white '>{column.columnDef.header}</div>,
      },
      {
        accessorKey: 'prob_above',
        header: 'Probability Above',
        Header: ({ column }) => <div className='text-white '>{column.columnDef.header}</div>,
      },
      {
        accessorKey: 'opt_mid_price',
        header: 'Option Mid Price',
        Header: ({ column }) => <div className='text-white '>{column.columnDef.header}</div>,
      },
      {
        accessorKey: 'percent_ask_time_value',
        header: '% Ask Time Value',
        Header: ({ column }) => <div className='text-white '>{column.columnDef.header}</div>,
      },
      {
        accessorKey: 'delta',
        header: 'Delta',
        Header: ({ column }) => <div className='text-white '>{column.columnDef.header}</div>,
      },
      {
        accessorKey: 'opt_open_int',
        header: 'Option Open Interest',
        Header: ({ column }) => <div className='text-white '>{column.columnDef.header}</div>,
      },
      {
        accessorKey: 'black_scholes_ratio_siv',
        header: 'Black-Scholes Ratio SIV',
        Header: ({ column }) => <div className='text-white '>{column.columnDef.header}</div>,
      },
      {
        accessorKey: 'black_scholes_ratio_50_day',
        header: 'Black-Scholes Ratio 50 Day',
        Header: ({ column }) => <div className='text-white '>{column.columnDef.header}</div>,
      },
      {
        accessorKey: 'iv_hv',
        header: 'IV/HV',
        Header: ({ column }) => <div className='text-white '>{column.columnDef.header}</div>,
      },
      {
        accessorKey: 'percent_bid_ask_spread',
        header: '% Bid/Ask Spread',
        Header: ({ column }) => <div className='text-white '>{column.columnDef.header}</div>,
      },
      {
        accessorKey: 'percent_return_1_sigma_max_risk',
        header: '% Return / % Max Risk',
        size: 150,
        Header: ({ column }) => <div className='text-white '>{column.columnDef.header}</div>,
        Cell: ({ cell, column }) => {

          const value = cell.getValue<number>();
          let width = '0%';
          let color = '';
          const calcValue = Math.round((value / max) * 100);
          width = `${calcValue}%`;
          if (calcValue > 0 && calcValue <= 10) {
            color = 'bg-[#FFD6D6]';
          } else if (calcValue > 10 && calcValue <= 50) {
            color = 'bg-[#FFEEAE]';
          } else if (calcValue > 50 && calcValue <= 100) {
            color = 'bg-[#A6F5BC]';
          }

          return (
            <div
              className='relative h-8 z-[1] flex items-center justify-end'
            >
              <h1>
                {value}
              </h1>
              <Box
                className={`absolute ${color} left-0 h-full -z-[1] top-1/2 -translate-y-1/2`}
                sx={{ width: width }}
              ></Box>
            </div >
          );
        },
      },
    ],
    []
  );

  const table = useMaterialReactTable({
    columns,
    enableDensityToggle: false,
    data: (data as unknown) as Api_resposne[],
    enablePagination: false,
    enableFullScreenToggle: false,
    enableStickyHeader: true,
    renderTopToolbar: () => <div>
      <h1 className='text-2xl font-bold font-mono'>Apple Inc.(AAPL) $214.29 <span className='text-red-800 ml-2'>($ -2.38) -1.1%</span></h1>
    </div>,
    initialState: {
      density: 'compact',
      showColumnFilters: true,
    },
    muiTopToolbarProps: {
      children: <Button>Custom Button</Button>
    },
    enableColumnActions: true,
    enableBottomToolbar: false,
    enableGlobalFilter: false,
    enableColumnFilters: true,

    muiTableHeadRowProps: {
      style: {
        backgroundColor: '#0F172A',
      }
    },
    defaultColumn:{
      size: 50,
      muiFilterTextFieldProps:{
        style:{
          borderBottom:'1px solid #ffffff'
        }
      }
    },
    muiTableBodyCellProps: {
      style: {
        borderRight: '1px solid #c1c1c1',
        padding: '0px',
        textAlign: 'right',
        fontFamily: 'monospace',
        fontWeight: 'bold',

      }
    },
    muiTableHeadCellProps: {
      sx: {
        '& *': {
          color: 'white',
        },
        height:'100%',
        paddingTop: '20px',
        paddingX: '10px',
      },
      style: {
        fontWeight: 'bold',
        border: '1px solid #c1c1c1',
        color: '#ffffff',
      }
    },
    muiTableHeadProps: {
      style: {
        backgroundColor: '#0F172A',
      }
    },
    muiTableProps: {
      style: {
        borderRadius: '20px',
        boxShadow: 'unset',
        textAlign: 'right',
        border: '1px solid #c1c1c1',
      }
    },
    muiTableBodyRowProps: (row) => ({
      sx: {
        backgroundColor: row.row.index % 2 === 0 ? '#b7b7b739' : 'white',
      },
    })
  });

  return <MaterialReactTable
    table={table}
  />;
}

export default App
