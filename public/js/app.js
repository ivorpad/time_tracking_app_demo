class TimersDashboard extends React.Component {
  state = {
    timers: [],
  };

  componentDidMount() {
    this.loadTimersFromServer();
    this.loadInterval = setInterval(this.loadTimersFromServer, 5000);
  }

  componentWillUnmount() {
    clearInterval(this.loadInterval);
  }

  loadTimersFromServer = () => {
    
    client.getTimers( serverTimers => {
        this.setState({ timers: serverTimers })
    }
    );
  };

  handleTrashClick = timerId => {
    this.deleteTimer(timerId)
  }

  handleStartClick = (timerId) => {
    this.startTimer(timerId);
  }

  handleStopClick = (timerId) => {
    this.stopTimer(timerId);
  }

  deleteTimer = timerId => {
    this.setState({
      timers: this.state.timers.filter( timer => timer.id !== timerId )
    });

    client.deleteTimer(timerId)
  }

  startTimer = (timerId) => {
    const now = Date.now();
    this.setState({
      timers: this.state.timers.map( timer => {
        if(timer.id === timerId) {
          return Object.assign({}, timer, {
            runningSince: now
          })
        } else {
          return timer;
        }
      })
    });

    client.startTimer(
      { id: timerId, start: now }
    )
  };

  stopTimer = (timerId) => {
    const now = Date.now();

    this.setState({
      timers: this.state.timers.map(timer => {
        if(timer.id === timerId) {
          const lastElapsed = now - timer.runningSince;
          return Object.assign({}, timer, {
            elapsed: timer.elapsed + lastElapsed,
            runningSince: null
          })
        } else {
          return timer;
        }
      })
    })

    client.stopTimer(
      { id: timerId, stop: now}
    )
  }

  handleCreateFormSubmit = timer => {
    this.createTimer(timer);
    
    client.createTimer(timer)
  };

  handleEditFormSubmit = attrs => {
    this.updateTimer(attrs);
  };

  createTimer = timer => {
    const t = helpers.newTimer(timer);
    this.setState({
      timers: this.state.timers.concat(t)
    });
  };

  updateTimer = attrs => {
    this.setState({
      timers: this.state.timers.map(timer => {
        if (timer.id === attrs.id) {
          return Object.assign({}, timer, {
            title: attrs.title,
            project: attrs.project
          });
        } else {
          return timer;
        }
      })
    });

    client.updateTimer(attrs)
  };

  render() {
    return (
      <div className="ui three column centered grid">
        <div className="column">
          <EditableTimerList
            timers={this.state.timers}
            onFormSubmit={this.handleEditFormSubmit}
            onTrashClick={this.handleTrashClick}
            onStartClick={this.handleStartClick}
            onStopClick={this.handleStopClick}
          />
          <ToggleableTimerForm onFormSubmit={this.handleCreateFormSubmit} />
        </div>
      </div>
    );
  }
}

class ToggleableTimerForm extends React.Component {
  state = {
    isOpen: false
  };

  handleFormOpen = () => {
    this.setState({ isOpen: true });
  };

  handleFormClose = () => {
    this.setState({ isOpen: false });
  };

  handleFormSubmit = timer => {
    this.props.onFormSubmit(timer);
    this.setState({ isOpen: false });
  };

  render() {
    if (this.state.isOpen) {
      return (
        <TimerForm
          onFormSubmit={this.handleFormSubmit}
          onFormClose={this.handleFormClose}
        />
      );
    } else {
      return (
        <div className="ui basic content center aligned segment">
          <button
            className="ui basic button icon"
            onClick={this.handleFormOpen}
          >
            <i className="plus icon" />
          </button>
        </div>
      );
    }
  }
}

class EditableTimerList extends React.Component {
  render() {
    const { timers } = this.props;
    const timerCard = timers.map((timer, i) => (
      <EditableTimer
        title={timer.title}
        project={timer.project}
        elapsed={timer.elapsed}
        runningSince={timer.runningSince}
        key={timer.id}
        id={timer.id}
        onFormSubmit={this.props.onFormSubmit}
        onTrashClick={this.props.onTrashClick}
        onStartClick={this.props.onStartClick}
        onStopClick={this.props.onStopClick}
      />
    ));

    return <div id="timers">{timerCard}</div>;
  }
}

class EditableTimer extends React.Component {
  state = {
    editFormOpen: false
  };

  handleSubmit = timer => {
    this.props.onFormSubmit(timer);
    this.closeForm();
  };

  closeForm = () => {
    this.setState({ editFormOpen: false });
  };

  openForm = () => {
    this.setState({ editFormOpen: true });
  };

  render() {
    const { title, project, id, elapsed, runningSince } = this.props;
    if (this.state.editFormOpen) {
      return (
        <TimerForm
          id={id}
          title={title}
          project={project}
          onFormSubmit={this.handleSubmit}
          onFormClose={this.closeForm}
        />
      );
    } else {
      return (
        <Timer
          id={id}
          title={title}
          project={project}
          elapsed={elapsed}
          runningSince={runningSince}
          onEditClick={this.openForm}
          onTrashClick={this.props.onTrashClick}
          onStartClick={this.props.onStartClick}
          onStopClick={this.props.onStopClick}
        />
      );
    }
  }
}

class Timer extends React.Component {

  componentDidMount() {
    this.forceUpdateInterval = setInterval(() => this.forceUpdate(), 50);
  }

  componentWillUnmount() {
    clearInterval(this.forceUpdateInterval);
  }

  handleTrashClick = () => {
    this.props.onTrashClick(this.props.id)
  }

  handleStartClick = () => {
    this.props.onStartClick(this.props.id)
  }

  handleStopClick = () => {
    this.props.onStopClick(this.props.id)
  }

  render() {
    const elapsedString = helpers.renderElapsedString(this.props.elapsed, this.props.runningSince);
    return (
      <div className="ui centered card">
        <div className="content">
          <div className="header">{this.props.title}</div>
          <div className="meta">{this.props.project}</div>
          <div className="center aligned description">
            <h2>{elapsedString}</h2>
          </div>
          <div className="extra content">
            <span
              className="right floated edit icon"
              onClick={this.props.onEditClick}
            >
              <i className="edit icon" />
            </span>
            <span className="right floated trash icon" onClick={this.handleTrashClick}>
              <i className="trash icon" />
            </span>
          </div>
        </div>
        <TimerActionButton
          timerIsRunning={!!this.props.runningSince}
          onStartClick={this.handleStartClick}
          onStopClick={this.handleStopClick}
        />
      </div>
    );
  }
}

class TimerActionButton extends React.Component {
  render() {
    if (this.props.timerIsRunning) {
      return(
        <div className="ui bottom attached red basic button" onClick={this.props.onStopClick}>
          Stop
        </div>
      )
    } else {
      return(
        <div className="ui bottom attached green basic button" onClick={this.props.onStartClick}>
          Start
        </div>
      )
    }

  }
}

class TimerForm extends React.Component {
  state = {
    title: this.props.title || "",
    project: this.props.project || ""
  };

  handleTitleChange = e => {
    this.setState({ title: e.target.value });
  };

  handleProjectChange = e => {
    this.setState({ project: e.target.value });
  };

  handleSubmit = () => {
    const timer = {
      id: this.props.id,
      title: this.state.title,
      project: this.state.project
    };
    this.props.onFormSubmit(timer);
  };

  render() {
    const submitText = this.props.id ? "Update" : "Create";
    return (
      <div className="ui centered card">
        <div className="content">
          <div className="ui form">
            <div className="field">
              <label>Title</label>
              <input
                type="text"
                value={this.state.title}
                onChange={this.handleTitleChange}
              />
            </div>
            <div className="field">
              <label>Project</label>
              <input
                type="text"
                value={this.state.project}
                onChange={this.handleProjectChange}
              />
            </div>

            <div className="ui two bottom attached buttons">
              <button
                className="ui basic blue button"
                onClick={this.handleSubmit}
              >
                {submitText}
              </button>
              <button
                className="ui basic red button"
                onClick={this.props.onFormClose}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<TimersDashboard />, document.getElementById("content"));
