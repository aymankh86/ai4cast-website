import React, { Component } from 'react';
import CSVReader from 'react-csv-reader'
import logo from './logo.svg';
import './App.css';
import Plot from 'react-plotly.js';
const PapaParse = require('papaparse/papaparse.min.js');

function multiFilter(array, filters, headers) {
  const filterKeys = Object.keys(filters);
  return array.filter((item) => {
    return filterKeys.every(key => !!~filters[key].indexOf(item[headers.indexOf(key)]));
  });
}

const average = (arr, window) => arr.reduce( ( p, c ) => p + c, 0 ) / arr.length;


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: {},
      forecast: false,
      headers: null,
      dateColumn: null,
      valuesColumn: null,
      filters: null,
      filtersValues: {},
      forecastValue: null,
      sidebarActive: false,
      language: "en"
    };
  }

  toggleSidebar = () => {
    this.setState({sidebarActive: !this.state.sidebarActive});
  }

  handleForce = (results) => {
    var headers = results[0];
    this.setState({results, headers});
  }

  processData = (_type, value) => {
    var dateColumn = this.state.dateColumn;
    var valuesColumn = this.state.valuesColumn;
    var filtersObj = null;
    var data = {};

    if (_type == 'dateColumn')
      dateColumn = value;
    else if (_type == 'valuesColumn')
      valuesColumn = value;

    if (dateColumn && valuesColumn) {
      var filters = this.state.headers.filter(x => x != dateColumn && x != valuesColumn);
      filtersObj = {};
      filters.forEach(f => {
        filtersObj[f] = {};
        var f_index = this.state.headers.indexOf(f);
        this.state.results.forEach((x, i) => {
          if (i == 0) {

          } else {
            if (x[f_index])
              filtersObj[f][x[f_index]] = 1;
          }
        })
      })
    }

    if (this.state.results && dateColumn && valuesColumn) {
      var dateColumnIndex = this.state.headers.indexOf(dateColumn);
      var valuesColumnIndex = this.state.headers.indexOf(valuesColumn);

      this.state.results.forEach((x, i) => {
        if (i == 0) {

        } else {
          if (x[dateColumnIndex]) {
            if (x[dateColumnIndex] in data)
              data[x[dateColumnIndex]] = data[x[dateColumnIndex]] += parseInt(x[valuesColumnIndex]);
            else
              data[x[dateColumnIndex]] = parseInt(x[valuesColumnIndex]);
          }
        }
      });
    }
    this.forecastHandler(data);
    this.setState({data: data, filters: filtersObj});
  }

  handleDarkSideForce = (err) => {
    console.log(err);
  }

  forecastHandler = (data) => {
    console.log(data);
    if (!data)
      data = this.state.data;
    var forecastValue = average(Object.values(data).slice(-10));
    this.setState({forecastValue});
  }

  dateColumnHandler = (event) => {
    this.setState({dateColumn: event.target.value});
    this.processData('dateColumn', event.target.value);
  }

  valuesColumnHandler = (event) => {
    this.setState({valuesColumn: event.target.value});
    this.processData('valuesColumn', event.target.value);
  }

  filterHandler = (_type, event) => {
    console.log(_type, event.target.value);
    var dateColumn = this.state.dateColumn;
    var valuesColumn = this.state.valuesColumn;
    var data = {};

    var dateColumnIndex = this.state.headers.indexOf(dateColumn);
    var valuesColumnIndex = this.state.headers.indexOf(valuesColumn);
    var filtersValues = this.state.filtersValues;
    if (event.target.value)
      filtersValues[_type] = [event.target.value];
    else
      delete filtersValues[_type];
    var filteredResults = multiFilter(this.state.results, filtersValues, this.state.headers);
    filteredResults.forEach((x, i) => {
      if (i == 0) {

      } else {
        if (x[dateColumnIndex]) {
          if (x[dateColumnIndex] in data)
            data[x[dateColumnIndex]] = data[x[dateColumnIndex]] += parseInt(x[valuesColumnIndex]);
          else
            data[x[dateColumnIndex]] = parseInt(x[valuesColumnIndex]);
        }
      }
    });
    this.forecastHandler(data);
    this.setState({data, filtersValues});
  }

  handleChangeFile = e => {
    let reader = new FileReader();
    if (e.target.files[0].size / 1024 / 1024 >= 2) {
      e.target.value = "";
      alert('File size exceeds 2 MB');
      return false;
    }
    const filename = e.target.files[0].name;
    reader.onload = event => {
      const csvData = PapaParse.parse(event.target.result, {
        error: this.handleDarkSideForce
      });
      this.handleForce(csvData.data, filename);
    };

    reader.readAsText(e.target.files[0]);
  };

  render() {
    var plotWidth = document.getElementById("sidebar") ? window.innerWidth - document.getElementById("sidebar").offsetWidth - 10 : 900;
    if (this.state.sidebarActive)
      plotWidth = window.innerWidth - 100

    var content = <div style={{margin: 100}}>
                    <h3>{this.state.language == "en" ? "Welcome to AI4CAST Demo application" : "أهلا بكم في النسخة التجريبية لبرنامج فوركاست"}</h3>
                  </div>;
    if (Object.keys(this.state.data).length && this.state.dateColumn && this.state.valuesColumn)
        content = <div className="container">
                <Plot
                  data={[
                    {
                      x: Object.keys(this.state.data),
                      y: Object.values(this.state.data),
                      type: 'scattergl',
                      mode: 'lines+points',
                      marker: {color: 'green'},
                      name: "Values"
                    }
                  ]}
                  layout={ {width: plotWidth, height: 600, title: this.state.language == "en" ? 'Time Series': 'التسلسل الزمني'} }
                />
              </div>;

    var dateColumnSelect = null;
    if (this.state.headers) {
      dateColumnSelect = (
        <li style={{marginBottom: 20}}><label>{this.state.language == "en" ? "Date Column" : "حقل التاريخ"}: </label><br />
        <select style={{width: "100%"}} onChange={this.dateColumnHandler}>
          <option value=''>{'---'}</option>
          {this.state.headers.map(x => <option>{x}</option>)}
        </select></li>
      )
    }

    var valuesColumnSelect = null;
    if (this.state.headers) {
      valuesColumnSelect = (
        <li style={{marginBottom: 20}}><label>{this.state.language == "en" ? "Values Column" : "حقل القيم"}: </label><br />
        <select style={{width: "100%"}} onChange={this.valuesColumnHandler}>
          <option value=''>{'---'}</option>
          {this.state.headers.map(x => <option>{x}</option>)}
        </select></li>
      )
    }

    var filters = null;
    if (this.state.filters) {
      filters = (
        <li>
          <a href="#filtersSubmenu" data-toggle="collapse" aria-expanded="false" className="dropdown-toggle">Filters</a>
          <ul className="collapse scrollable-menu list-unstyled" id="filtersSubmenu">
            {Object.keys(this.state.filters).map(filter =>
              <li style={{marginBottom: 20}}>
                <label>{filter}: </label><br />
                <select style={{width: "100%"}} onChange={this.filterHandler.bind(this, filter)}>
                  <option value=''>{"---"}</option>
                  {Object.keys(this.state.filters[filter]).map(x => <option>{x}</option>)}
                </select>
              </li>
            )}
          </ul>
        </li>
      )
    }

    return (
      <div className="wrapper">
        <nav id="sidebar" className={this.state.sidebarActive ? "active" : ""}>
            <div className="sidebar-header">
                <h3>AI4CAST DEMO</h3>
            </div>

            <ul className="list-unstyled components">
              <li>
                  <p>{this.state.language == 'en' ? "Upload dataset file" : "تحميل ملف البيانات"}</p>
                  {/*<CSVReader
                    cssClass="csv-input"
                    label=""
                    onFileLoaded={this.handleForce}
                    onError={this.handleDarkSideForce}
                    inputId="ObiWan"
                  />*/}
                  <input className="csv-input" type="file" accept="text/csv" onChange={e => this.handleChangeFile(e)} />
                </li>
            </ul>
            <ul className="list-unstyled CTAs">
                {dateColumnSelect}
                {valuesColumnSelect}
                {filters}
            </ul>

            <ul className="list-unstyled CTAs">
                <li>
                    <a href="http://www.ai4cast.com" className="article">
                      {this.state.language == "en" ? "Back to website" : "العودة إلى الموقع"}</a>
                </li>
            </ul>
        </nav>

        <div id="content" style={{width: "100%"}}>
            <nav className="navbar navbar-expand-lg navbar-light bg-light">
                <div className="container-fluid">
                    <button type="button" id="sidebarCollapse" onClick={this.toggleSidebar} className="btn btn-info">
                        <i className="fas fa-align-left"></i>
                        <span>{this.state.sidebarActive ? ">> AI4CAST Demo" : "<"}</span>
                    </button>
                    <span className="text-danger"
                          style={{fontWeight: "bold",
                                  display: Object.keys(this.state.data).length ? "block" : "none"}}>
                        {this.state.language == "en" ? "Forecast Value": "القيم المتوقعة"}: {Math.round(this.state.forecastValue)}
                    </span>
                    <a className="text-primary" target="_blank" href="assets/sales_demo.csv">
                      <b>{this.state.language == "en" ? "Download sample file" : "ملف بيانات تجريبي"}</b></a>
                </div>
            </nav>
            {content}
        </div>
    </div>
    );
  }
}

export default App;
