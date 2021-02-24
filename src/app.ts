enum ProjectStatus {
	Active,
	Finished
}

// Project Type
class Project {
	constructor(
		public id: string,
		public title: string,
		public description: string,
		public people: number,
		public status: ProjectStatus
	) {}
}

// Project State Management class
type Listener<T> = (items: T[]) => void;

class State<T> {
	protected listeners: Listener<T>[] = [];

	addListener(listenerFunction: Listener<T>) {
		this.listeners.push(listenerFunction);
	}
}

class ProjectState extends State<Project> {
	private projects: Project[] = [];
	private static instance: ProjectState;

	private constructor() {
		super();
	}

	addProject(title: string, description: string, numOfPeople: number) {
		// Math.random for testing only
		const id = Math.random().toString();
		const newProject = new Project(id, title, description, numOfPeople, ProjectStatus.Active);

		this.projects.push(newProject);
		for (const listenerFunction of this.listeners) {
			listenerFunction(this.projects.slice());
		}
	}

	static getInstance() {
		if (this.instance) {
			return this.instance;
		}
		this.instance = new ProjectState();
		return this.instance;
	}
}

const projectState = ProjectState.getInstance();

// Validation
interface Validatable {
	value: string | number;
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	min?: number;
	max?: number;
}

function validate(validatableInput: Validatable) {
	let isValid = true;

	if (validatableInput.required) {
		isValid = isValid && validatableInput.value.toString().trim().length !== 0;
	}
	if (validatableInput.minLength != null && typeof validatableInput.value === 'string') {
		isValid = isValid && validatableInput.value.trim().length >= validatableInput.minLength;
	}
	if (validatableInput.maxLength != null && typeof validatableInput.value === 'string') {
		isValid = isValid && validatableInput.value.trim().length <= validatableInput.maxLength;
	}
	if (validatableInput.min != null && typeof validatableInput.value === 'number') {
		isValid = isValid && validatableInput.value >= validatableInput.min;
	}
	if (validatableInput.max != null && typeof validatableInput.value === 'number') {
		isValid = isValid && validatableInput.value <= validatableInput.max;
	}

	return isValid;
}

// autobind decorator
const autoBind = (_target: any, _method: string, descriptor: PropertyDescriptor) => {
	const originalMethod = descriptor.value;
	const adjDescriptor: PropertyDescriptor = {
		configurable: true,
		get() {
			const boundFunction = originalMethod.bind(this);
			return boundFunction;
		}
	};
	return adjDescriptor;
};

// Component Base Class
abstract class Component<T extends HTMLElement, U extends HTMLElement> {
	templateElement: HTMLTemplateElement;
	hostElement: T;
	element: U;

	constructor(templateId: string, hostElementId: string, insertAtStart: boolean, newElementId?: string) {
		this.templateElement = document.getElementById(templateId)! as HTMLTemplateElement;
		this.hostElement = document.getElementById(hostElementId)! as T;

		const importedNode = document.importNode(this.templateElement.content, true);
		this.element = importedNode.firstElementChild as U;
		if (newElementId) {
			this.element.id = newElementId;
		}

		this.attach(insertAtStart);
	}

	private attach(insertAtBeginning: boolean) {
		this.hostElement.insertAdjacentElement(insertAtBeginning ? 'afterbegin' : 'beforeend', this.element);
	}

	abstract configure(): void;
	abstract renderContent(): void;
}

// ProjectInput Class
class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
	titleInputElement: HTMLInputElement;
	descriptionInputElement: HTMLInputElement;
	peopleInputElement: HTMLInputElement;

	constructor() {
		super('project-input', 'app', true, 'user-input');

		this.titleInputElement = this.element.querySelector('#title') as HTMLInputElement;
		this.descriptionInputElement = this.element.querySelector('#description') as HTMLInputElement;
		this.peopleInputElement = this.element.querySelector('#people') as HTMLInputElement;

		this.configure();
	}

	configure() {
		this.element.addEventListener('submit', this.submitHandler);
	}

	renderContent() {}

	private gatherUserInput(): [string, string, number] | void {
		const enteredTitle = this.titleInputElement.value;
		const enteredDescription = this.descriptionInputElement.value;
		const enteredPeople = this.peopleInputElement.value;

		const titleValidatable = {
			value: enteredTitle,
			required: true
		};
		const descriptionValidatable = {
			value: enteredDescription,
			required: true,
			minLength: 5
		};
		const peopleValidatable = {
			value: +enteredPeople,
			required: true,
			min: 2,
			max: 4
		};

		const isValid = validate(titleValidatable) && validate(descriptionValidatable) && validate(peopleValidatable);

		if (!isValid) {
			alert('Invalid input');
			return;
		} else {
			return [enteredTitle, enteredDescription, +enteredPeople];
		}
	}

	private clearInputs() {
		this.titleInputElement.value = '';
		this.descriptionInputElement.value = '';
		this.peopleInputElement.value = '';
	}

	@autoBind
	private submitHandler(e: Event) {
		e.preventDefault();
		const userInput = this.gatherUserInput();
		if (Array.isArray(userInput)) {
			const [title, description, people] = userInput;
			projectState.addProject(title, description, people);
			this.clearInputs();
		}
	}
}

// ProjectList Class
class ProjectList extends Component<HTMLDivElement, HTMLElement> {
	assignedProjects: Project[];

	constructor(private type: 'active' | 'finished') {
		super('project-list', 'app', false, `${type}-projects`);
		this.assignedProjects = [];

		this.configure();
		this.renderContent();
	}

	configure() {
		projectState.addListener((projects: Project[]) => {
			const relativeProjects = projects.filter(({ status }) => {
				if (this.type === 'active') {
					return status === ProjectStatus.Active;
				}
				return status === ProjectStatus.Finished;
			});
			this.assignedProjects = relativeProjects;
			this.renderProjects();
		});
	}

	renderContent() {
		const listId = `${this.type}-projects-list`;
		this.element.querySelector('ul')!.id = listId;
		this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + ' PROJECTS';
	}

	private renderProjects() {
		const listElement = document.getElementById(`${this.type}-projects-list`)! as HTMLUListElement;
		listElement.innerHTML = '';

		for (const project of this.assignedProjects) {
			const listItem = document.createElement('li');
			listItem.textContent = project.title;
			listElement.appendChild(listItem);
		}
	}
}

const projectInput = new ProjectInput();
const activeList = new ProjectList('active');
const finishedList = new ProjectList('finished');
