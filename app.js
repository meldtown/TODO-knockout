const apiUrl = 'http://localhost:3003/todos'

class Model {
  constructor() {
    this.todos = ko.observableArray([]);
    this.totalCount = ko.computed(() => this.todos().length);
    this.addedTodo = ko.observable('');
    this.isAddButtonDisabled = ko.computed(() => !this.addedTodo().trim());

    //Filtering TODOS
    this.filters = ['All', 'Completed', 'Active']
    this.currentFilter = ko.observable('All');
    this.filteredTodos = ko.computed(() => {
      const filter = this.currentFilter();
      const todos = this.todos();
      switch (filter) {
        case 'Completed':
          return todos.filter(todo => todo.completed());
        case 'Active':
          return todos.filter(todo => !todo.completed());
        default:
          return todos;
      }
    })

    //Sorting TODOS
    this.sortOptions = ['None', 'Asc', 'Desc'];
    this.currentSortOption = ko.observable('None');
    this.sortedAndFilteredTodos = ko.computed(() => {
      const filteredTodos = this.filteredTodos();
      const todos = [...filteredTodos];
      const sortOption = this.currentSortOption();
      const sortedByAscTodos = todos.sort((a, b) => {
        return a.actualText().toLowerCase() > b.actualText().toLowerCase() ? 1 : -1;
      } );
      switch (sortOption) {
        case 'Asc':
          return sortedByAscTodos;
        case 'Desc':
          return sortedByAscTodos.reverse();
        default:
          return filteredTodos;
      }
    });

    //Load TODOS on start
    this.fetchTodos();
  }

  fetchTodos() {
    axios.get(apiUrl).then(({data}) => {
      const todos = data.map(todo => new Todo(todo, this));
      this.todos(todos);
    });
  }

  saveTodo(data, e) {
    e.preventDefault();
    const text = this.addedTodo();
    const todo = {text};
    axios.post(apiUrl, todo).then(({data: todo}) => {
      this.todos.push(new Todo(todo, this));
      this.addedTodo('')
    });
  }
}

class Todo {
  constructor(todo, parent) {
    const {id, text, completed} = todo;
    this.parent = parent;
    this.id = id;
    this.text = text;
    this.actualText = ko.observable(text);
    this.completed = ko.observable(completed);
    this.isEdited = ko.observable(false);
    this.isSaveButtonDisabled = ko.computed(() => {
      const actualText = this.actualText().trim();
      const text = this.text.trim();
      return !actualText || actualText === text;
    })
  }

  toggle() {
    const data = ko.toJS(this);
    const {id, completed, text} = data;
    const todo = {id, completed, text};
    axios.put(`${apiUrl}/${id}`, todo).catch(error => {
      console.error(error);
      this.completed(!completed);
    })
  }

  save() {
    const data = ko.toJS(this);
    const {id, actualText, completed} = data;
    const todo = {id, text: actualText, completed};
    axios.put(`${apiUrl}/${id}`, todo).then(() => {
      this.text = actualText;
      this.cancel();
    })
  }

  remove() {
    const id = this.id;
    axios.delete(`${apiUrl}/${id}`).then(() => this.parent.todos.remove(this))
  }

  edit() {
    this.isEdited(true);
  }

  cancel() {
    this.actualText(this.text);
    this.isEdited(false);
  }
}