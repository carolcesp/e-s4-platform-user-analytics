import React, { Component } from "react";
import { Link } from 'react-router-dom';
import { requestCharts } from './../../services/ChartsService';
import { requestGroups } from './../../services/GroupsService';
import TableCharts from './TableCharts';

class ChartsUsage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      userData: [],
      chartList: [],
      allGroupsList: [],
      groupsList: [],
      filterOptionsChecked: false,
      timelapse: 7,
      display: 'hidden',
      fromDate: new Date(),
      toDate: new Date(),
    }

    this.handleOptions = this.handleOptions.bind(this);

    this.handleChangeDate = this.handleChangeDate.bind(this);
    this.handleDateFrom = this.handleDateFrom.bind(this);
    this.handleDateTo = this.handleDateTo.bind(this);
    this.visibilitySetDate = this.visibilitySetDate.bind(this);

    this.handleUserGroups = this.handleUserGroups.bind(this);
    this.selectAllGroups = this.selectAllGroups.bind(this);
    this.clearAllGroups = this.clearAllGroups.bind(this);

    this.filterAll = this.filterAll.bind(this);
  }

  componentDidMount() {
    this.fetchGroups();
    this.renderUserGroups(true);
    this.fetchCharts(this.state.timelapse);
  }

  getGroups(groups) {
    const groupsList = groups.map(item => {
      return item.name;
    });

    return groupsList;
  }

  renderUserGroups(check) {
    this.setState((prevState) => {

      const sortedSet = prevState.allGroupsList;

      const userGroupsInputs = sortedSet.map((item, index) => {
        return (
          <li key={index}>
            <label htmlFor={item}>
              <input onChange={this.handleUserGroups} id={item} type="checkbox" value={item} name={item} defaultChecked={check} />
              {item}
            </label>
          </li>
        );
      });

      return { userGroupsInputs: userGroupsInputs };
    });
  }

  fetchGroups() {
    requestGroups()
      .then(data => {
        const groupData = this.getGroups(data.groups);
        const allGroups = groupData.slice();

        this.setState({
          allGroupsList: allGroups,
          groupsList: groupData
        }, () => this.renderUserGroups(true));
      });
  }

  fetchCharts(timelapse) {
    let toDate = new Date();
    let fromDate = new Date().setDate(toDate.getDate() - timelapse);

    fromDate = new Date(fromDate).toISOString();
    toDate = new Date(toDate).toISOString();

    requestCharts(fromDate, toDate)
      .then(data => {
        this.setState({
          chartList: data.open_chart_events,
          userData: data
        });

        this.filterAll();
      });
  }

  handleOptions(e) {
    const optionsTarget = e.currentTarget.checked;

    this.setState({
      filterOptionsChecked: optionsTarget
    }, () => this.filterAll());
  }

  handleDateTo(e) {
    e.persist();
    this.setState({
      toDate: e.currentTarget.value
    }, () => this.handleChangeDate(e));
  }

  handleDateFrom(e) {
    e.persist();
    this.setState({
      fromDate: e.currentTarget.value
    }, () => this.handleChangeDate(e));
  }

  handleChangeDate(e) {
    let ct = new Date();
    let fd = new Date();
    let period;

    if (e.currentTarget) {
      period = e.currentTarget.value;
    }

    switch (period) {
      case 'last-week':
        fd.setDate(fd.getDate() - 7);
        break;

      case 'last-month':
        fd.setMonth(fd.getMonth() - 1);
        break;

      case 'last-two-months':
        fd.setMonth(fd.getMonth() - 2);
        break;

      case 'always':
        fd = new Date(2015, 0, 1, 0, 0);
        break;

      default:
        ct = new Date(this.state.toDate);
        fd = new Date(this.state.fromDate);
        break;
    }

    const timelapse = Math.round((ct - fd) / (1000 * 60 * 60 * 24));

    this.setState({
      timelapse: timelapse
    });

    this.fetchCharts(timelapse);
  }

  handleUserGroups(e) {
    const userGroupsTarget = e.currentTarget.value;

    this.setState((prevState) => {
      const { groupsList } = prevState;

      if (groupsList.indexOf(userGroupsTarget) === -1) {
        groupsList.push(userGroupsTarget);

      } else {
        groupsList.splice(groupsList.indexOf(userGroupsTarget), 1);
      }

      return { groupsList: groupsList }
    }, () => this.filterAll());
  }

  filterAll() {
    const originalCharts = this.state.userData.open_chart_events;
    const supportChecked = this.state.filterOptionsChecked;

    const removedSupport = originalCharts.filter(item => {
      if (supportChecked) {
        return !item.request.user__username.includes('stylesage');

      } else {
        return item;
      }
    });

    const removedGroups = removedSupport.filter(chart => {
      const isGroupPresent = this.state.groupsList.map(group => {
        if (chart.request.user__group__name === group) {
          return true;

        } else {
          return false;
        }
      });

      let isPresent = false;

      for (let ii = 0; ii < isGroupPresent.length; ii++) {
        if (isGroupPresent[ii] === true) {
          isPresent = true;
        }
      }

      return isPresent;
    });

    this.setState({
      chartList: removedGroups
    });
  }

  visibilitySetDate(e) {
    const hiddenClassSetDate = (this.state.display === 'hidden' && e.currentTarget.value === 'set-date') ? '' : 'hidden';

    this.setState({
      display: hiddenClassSetDate
    });
  }

  selectAllGroups() {
    this.setState((prevState) => {
      const groups = prevState.allGroupsList.slice();

      return {
        userGroupsInputs: '',
        groupsList: groups
      }
    }, () => {
      this.renderUserGroups(true);
      this.filterAll();
    });
  }

  clearAllGroups() {
    const groups = [];

    this.setState({
      userGroupsInputs: '',
      groupsList: groups
    }, () => {
      this.renderUserGroups(false);
      this.filterAll();
    });
  }

  render() {
    const { chartList, display } = this.state;
    const userGroupsInputs = this.state.userGroupsInputs;

    return (
      <div className={`app__container  ${this.props.hiddenButton}`}>
        <main className="app__main">
          <div className="breadcrumb__container">
            <ul className="breadcrumb__container-list">
              <li className="breadcrumb__container-item">
                <Link to="/" className="breadcrumb__link">Overview</Link>
              </li>  >
              <li className="breadcrumb__container-item">
                <span>ChartsUsage</span>
              </li>
            </ul>
          </div>
          <div className="charts__container">
            <div className="table__container">
              <TableCharts chartList={chartList} />
            </div>
            <div className="chart__filters">
              <div className="chart__filter chart__filter-options">
                <div className="chart__filter-header">
                  <i className="zmdi zmdi-account-add"></i>
                  <h3 className="chart__filter-title">OPTIONS</h3>
                </div>
                <div className="chart__filter-content">
                  <label>
                    <input type="checkbox" onClick={this.handleOptions} defaultChecked={false} /> exclude support users (x@stylesage.com)
                  </label>
                </div>
              </div>
              <div className="chart__filter chart__filter-range">
                <div className="chart__filter-header">
                  <i className="zmdi zmdi-calendar-check"></i>
                  <h3 className="chart__filter-title">DATE RANGE</h3>
                </div>
                <div className="chart__filter-content">
                  <div>
                    <label htmlFor="last-week" >
                      <input defaultChecked={true} onClick={this.visibilitySetDate} onChange={this.handleChangeDate} type="radio" id="last-week" name="date" value="last-week" className="input__type-radio" />
                      <span></span>last week
                    </label>
                  </div>
                  <div >
                    <label htmlFor="last-month">
                      <input onClick={this.visibilitySetDate} onChange={this.handleChangeDate} type="radio" id="last-month" name="date" value="last-month" className="input__type-radio" />
                      <span></span>last month
                    </label>
                  </div>
                  <div>
                    <label htmlFor="last-two-months">
                      <input onClick={this.visibilitySetDate} onChange={this.handleChangeDate} type="radio" id="last-two-months" name="date" value="last-two-months" className="input__type-radio" />
                      <span></span>last 2 months
                    </label>
                  </div>
                  <div>
                    <label htmlFor="set-date">
                      <input onClick={this.visibilitySetDate} type="radio" id="set-date" name="date" value="set-date" className="input__type-radio" />
                      <span></span>set date
                    </label>
                  </div>
                  <div className={`contentSetDate ${display}`}>
                    <div>
                      <label htmlFor="from-date">
                        <input onChange={this.handleDateFrom} id="from-date" type="date" name="date??" />
                        from date
                    </label>
                    </div>
                    <div>
                      <label htmlFor="to-date">
                        <input onChange={this.handleDateTo} id="to-date" type="date" name="date??" />
                        to date
                    </label>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="always">
                      <input onClick={this.visibilitySetDate} onChange={this.handleChangeDate} type="radio" id="always" name="date" value="always" className="input__type-radio" />
                      <span></span>always
                    </label>
                  </div>
                </div>
              </div>
              <div className="chart__filter chart__filter-groups">
                <div className="chart__filter-header">
                  <i className="zmdi zmdi-accounts"></i>
                  <h3 className="chart__filter-title">USER GROUPS</h3>
                </div>
                <div className="chart__filter-content">
                  <div className="chart__filter-select">
                    <button type="button" className="btn-select" onClick={this.selectAllGroups} data-select="select all">select all</button>
                    <button type="button" className="btn-select" onClick={this.clearAllGroups} data-select="clear all">clear all</button>
                  </div>
                  <ul className="chart__filter-listgroups">
                    {userGroupsInputs}
                  </ul>
                </div>

              </div>
            </div>
          </div>
        </main>
      </div>
    );
  };
};

export default ChartsUsage;
