class EarliestDeadlineFirst {
  name = 'Earliest Deadline First';

  getName(){
    return this.name;
  }

	setPriorities(element){
		return element.sort(function(a,b){ return a.deadline - b.deadline; });
	}
}

class RateMonotonic {
  name = 'Rate Monotonic';

  getName(){
    return this.name;
  }

	setPriorities(element){
		return element.sort(function(a,b){ return a.period - b.period; });
	}
  
}

class Task {
  constructor(name, C, T, D = T) {
  	this.name = name;
    this.execution = C;
    this.period = T;
    this.deadline = D;
  }
}

class Scheduler {
	constructor(algorithm, tasks = []) {
    this.algorithm = this.setAlgorithm(algorithm);
		this.tasks = tasks;
		this.feasible = null;
		this.schedulable = null;
    this.lub = this.setLUB();
    this.cpu_usage = this.setCPUUsage();
    this.interval = [];
    this.render = [];
	}

  available_algorithms = new Map([
    ['EDF', new EarliestDeadlineFirst()],
    ['RM', new RateMonotonic()]
  ]);

  setAlgorithm(algorithm){
    return this.available_algorithms.get(algorithm);
  }

	setPriorities(){
		this.tasks = this.algorithm.setPriorities(this.tasks);
	}

	setEndCycle(){
    this.interval = [0, this.lcm(this.tasks)];
	}

  lcm(tasks){
		const gcd2 = (a, b) => {
      if(!b) return b===0 ? a : NaN;
      return gcd2(b, a%b);
    };
    const lcm2 = (a, b) => {
      return a * b / gcd2(a, b);
    }
    let n = 1;
    for(let i = 0; i < tasks.length; ++i){
      n = lcm2(tasks[i].deadline, n);
    }
    return n;
  }

  setLUB(){
    return this.tasks.length * (Math.pow(2, 1/this.tasks.length) - 1);
  }

  setCPUUsage(){
    let count = 0;
    this.tasks.forEach(element => {
      count += (element.execution / element.deadline);
    });
    return count;
  }

	execute(){
    this.setPriorities();
    this.setEndCycle();
		this.render = this.schedule(this.interval, this.tasks);
	}

  showInformation(){
    console.log('Using Algorithm: ', this.algorithm.getName());
    console.log('Set of Tasks: ', this.tasks);
    console.log('LUB: ', this.lub);
    console.log('CPU Usage: ', this.cpu_usage);
    console.log('Interval Used: ', this.interval)
  };

  showResults(){
    console.log('Is Feasible: ', this.feasible);
    console.log('Is Schedulable: ', this.schedulable);
    console.log('intervalos de jobs para gráfico', this.render)
  }

  init(){
    this.execute();
    this.showInformation();
    this.showResults();
  }

  schedule(interval, tasks){
    let all_jobs = [];
    let releases = [];
    let run_queue = [];
    let render = [];
    let overflow = false;

    tasks.forEach((task) =>{
      const max_jobs = (Math.ceil(interval[1] / task.period) - 1);

      for (let index = 0; index <= max_jobs; index++) {
        const release = task.period * index
        all_jobs.push({
                      'task' : task.name,
                      'name' : 'j' + (index + 1),
                      'release': release,
                      'execution': task.execution,
                      'period': task.period,
                      'deadline' : release + task.deadline,
                    });
      }
    });

    releases = [...new Set(all_jobs.map(item => item.release))].sort((a, b) => a - b);
    all_jobs = this.algorithm.setPriorities(all_jobs);

    releases.forEach((release, index, object) => {
      if(overflow) { return; }

      run_queue = run_queue.concat(all_jobs.filter(job => {return job.release === release}));
      run_queue = this.algorithm.setPriorities(run_queue);

      while(run_queue.length !== 0){
        const job = run_queue[0];

        const last_ran_job = render[render.length - 1]; // última job executada (parcial ou completa)
        const next_release = object[index + 1];

        const job_begin =  (last_ran_job !== undefined && job.release <= last_ran_job.end) ? last_ran_job.end : job.release;
        const needed_execution = job_begin + job.execution;

        if(needed_execution > job.deadline) {
          overflow = true;
          console.log({'overflow' : overflow}, {'job_begin' : job_begin}, {'job_deadline' : job.deadline}, {'needed_execution' : needed_execution}, {'job' : job});
          break;
        }

        const preempcao = (next_release !== undefined && needed_execution > next_release);
        if(preempcao) {
          const execution = next_release - job_begin
          const remaining_execution = job.execution - execution;
          const job_end = next_release;

          const continue_job = {
            'task' : job.task,
            'name' : job.name,
            'release' : job.release,
            'execution' : remaining_execution,
            'period' : job.period,
            'deadline' : job.deadline,
            'begin' : null,
            'end' : null
          };

          const job_done = {
            'task' : job.task,
            'name' : job.name,
            'release' : job.release,
            'execution' : execution,
            'period' : job.period,
            'deadline' : job.deadline,
            'begin' : job_begin,
            'end' : job_end
          };

          job_done.execution !== 0 ? render.push(job_done) : false;

          run_queue.push(continue_job);
          run_queue.splice(0,1);
          run_queue = this.algorithm.setPriorities(run_queue);

          break;
        } else {
          const job_end = needed_execution;
          const job_done = {
            'task' : job.task,
            'name' : job.name,
            'release' : job.release,
            'execution' : job.execution,
            'period' : job.period,
            'deadline' : job.deadline,
            'begin' : job_begin,
            'end' : job_end
          };

          job_done.execution !== 0 ? render.push(job_done) : false;
          run_queue.splice(0,1);
          run_queue = this.algorithm.setPriorities(run_queue);

        }

      }

    });
    
    return render;
  }

}

// Intialization...
// Casos Teste em RM
// const algorithm = 'RM';
// const tasks = [new Task('t1',2,9), new Task('t2',2,5), new Task('t3',1,3)];

// Casos Teste em EDF
const algorithm = 'EDF';
const tasks = [new Task('p1',25,50), new Task('p2',30,75)]; // caso teste EDF do site Geeks for Geeks


const scheduler = new Scheduler(algorithm, tasks);
scheduler.init();