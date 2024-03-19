import template from './Input.hbs';

/**
* Класс Input. Экземпляры этого класса - строки для ввода данных.
* @class
*/
class Input {
  /**
  * Создает новый экземпляр поля ввода.
  * @param {HTMLElement} parent - Родительский элемент, в который будет вставлено поле ввода.
  * @param {Object} options - Объект с параметрами поля ввода.
  * @param {string} [options.field=''] - Имя поля ввода.
  * @param {string} [options.id=''] - Идентификатор поля ввода.
  * @param {string} [options.placeholder=''] - Подсказка в поле ввода.
  * @param {string} [options.type='text'] - Тип поля ввода (например, 'text', 'password').
  * @param {string} [options.img=''] - URL изображения для поля ввода.
  * @param {string} [options.className=''] - CSS-класс поля ввода.
  */
  constructor(parent, {
    field = '', id = '', placeholder = '', type = 'text', img = '', className = '',
  }) {
    this.parent = parent;
    this.field = field;
    this.placeholder = placeholder;
    this.type = type;
    this.img = img;
    this.className = className;
    this.id = id;
  }

  /**
  * Возвращает HTML-представление поля ввода.
  * @returns {string} HTML-представление поля ввода.
  */
  asHTML() {
    return template({
      id: this.id,
      placeholder: this.placeholder,
      type: this.type,
      img: this.img,
      className: this.className,
      field: this.field,
    });
  }

  validate(inputText, type) {    
    const emailRegexp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    const passwordRegexp = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/
    switch(type) {
      case 1://email validation
        if (inputText === "") {
          return "Введите электронную почту";
        } else {
          if (emailRegexp.test(inputText)) {
            console.log("correct");
            return null;
          }
          return "Неверный формат электронной почты";
        }
      case 2: // password validation:
        if (passwordRegexp.test(inputText)) {
          return null;
        }
        return "Пароль должен содержать 8-32 символа, включая специальные символы, заглавную букву и цифры"
    }
    return "Что-то пошло не так" 
  }

  /**
  * Рендерит поле ввода в DOM.
  */
  render() {
    this.parent.insertAdjacentHTML('beforeend', this.asHTML());
  }
}

export default Input;
