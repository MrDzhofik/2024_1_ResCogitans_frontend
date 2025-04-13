import Base from '@components/Base/Base';
import Header from '@components/Header/Header';
import { Journey, Sight, WithResponse } from 'src/types/api';
import Place from '@pages/PlacesPage/Placelist/Place/Place';
import { post, showroute } from '@api/base';
import { getTrip } from '@api/journey';
import { getSights } from '@api/sight';
import { router } from '@router/router';
import urls from '@router/urls';
import { ROUTES } from '@router/ROUTES';
import template from '@templates/JourneyPage.hbs';


import AuthorizationForm from '@components/Form/AuthorizationForm';

class JourneyPage extends Base {

  parent: HTMLElement;

  IDs: number[];

  tripID: number;

  journey: Journey;

  isOwn: boolean;

  isEdit: boolean;

  type?: string;

  constructor(parent: HTMLElement, params: any) {
    super(parent, template);

    this.IDs = [];
    this.isOwn = false;


    if (params[0] === 'new') {
      this.type = 'new';
    } else {
      if (params[1] === 'edit') {
        this.type = 'edit';
      } else {
        this.type = 'view';
      }
      this.tripID = params[0];
    }

    this.isEdit = (this.type === 'edit' || this.type === 'new');


  }

  renderDeletePlaceButton(id: string) {

    const currentCard = document.querySelector(`#card-${id}`) as HTMLDivElement;
    const deleteButton = this.createElement('button', {
      class: 'button button-primary top-right close-icon',
    }, '', {
      parent: currentCard,
    });

    deleteButton.addEventListener('click', () => {
      this.removeCard(id);
    });

  }

  removeCard(id: string) {
    if (id !== undefined) {
      const sightCard = document.getElementById(`card-${id}`) as HTMLDivElement || null;
      if (sightCard !== null) {
        sightCard.remove();
        this.IDs = this.IDs.filter(item => item !== parseInt(id));
        return;
      }
    }
  }

  addSightsToOptions() {
    if (this.isEdit === false) {
      return;
    }
    const placelist = document.querySelector('#list-places') as HTMLDivElement;
    getSights().then((sightResponse) => {
      sightResponse.data.sights.sort((a: Sight, b: Sight) => {
        const A = a.name.toUpperCase();
        const B = b.name.toUpperCase();
        if (A < B) { return -1; }
        if (A > B) { return 1; }
        return 0;
      });

      let sights = sightResponse.data.sights;
      const sightSelect = document.querySelector('select') as HTMLSelectElement;

      sights.forEach((data) => {
        const option = document.createElement('option');
        option.value = String(data.id);
        option.text = data.name;
        sightSelect?.appendChild(option);
      });

      sightSelect.addEventListener('change', () => {
        const activeCards = document.querySelectorAll('.card');
        if (sightSelect.selectedIndex === -1) {
          activeCards.item(activeCards.length - 1).remove();
          this.IDs.pop();
          return;
        }
        const selectedOption = sightSelect.options[sightSelect.selectedIndex];
        this.removeCard(selectedOption.value);

        const sightSelected = sights.find(entry => entry.id === parseInt(selectedOption.value));
        if (sightSelected) {
          this.IDs.push(parseInt(selectedOption.value));
          new Place(placelist, sightSelected).render();

          if (this.type === 'edit' || this.type === 'new') {
            this.renderDeletePlaceButton(String(selectedOption.value));
          }
        }
      });
    });
  }

  render() {

    if (this.type === null) {
      this.type = 'new';
    }

    document.body.classList.remove('auth-background');
    let journeyInfoDiv, title, header;

    switch (this.type) {
      case 'new':

        if (this.userData.userID === undefined) {
          router.go('login');
        }

        this.preRender();

        header = document.getElementById('header') as HTMLElement;
        new Header(header).render();

        journeyInfoDiv = document.getElementById('journey-info');
        title = document.createElement('h1');
        title.textContent = 'Создание поездки';
        journeyInfoDiv?.insertAdjacentElement('afterbegin', title);


        this.addSightsToOptions();

        const submitButton = document.getElementById('button-submit') as HTMLButtonElement;
        submitButton.textContent = 'Создать';
        document.getElementById('button-delete-journey')?.remove();
        let form = document.querySelector('form') as HTMLFormElement;

        submitButton.addEventListener('click', (e: Event) => {
          e.preventDefault();

          const errorDisplay = new AuthorizationForm(this.parent, '');
          errorDisplay.clearError(form);

          if (this.IDs.length === 0) {
            errorDisplay.renderError(form, 'Выберите места для поездки');
            return;
          }

          const userID = this.userData.userID;
          const nameInput = document.querySelector('input') as HTMLInputElement;
          const descriptionInput = document.querySelector('textarea') as HTMLTextAreaElement;
          const body = {
            userID: userID, name: nameInput.value, description: descriptionInput.value,
          };

          post('trip/create', body).then((response) => {
            if (response.status === 200) {
              this.tripID = response.data.id;
              post(`trip/${this.tripID}/sight/add`, {
                sightIDs: this.IDs,
              }).then(() => {
                this.type = 'view';
                router.go(ROUTES.journey.view(this.tripID));
              });
            } else {
              if (response.status === 500) {
                errorDisplay.renderError(form, 'Поездка с таким именем уже есть');
                return;
              } else {
                router.go('login');
              }
            }
          });
        });
        break;
      case 'view':
      case 'edit':

        getTrip(this.tripID).then((journeyResponse) => {
          this.isOwn = (this.userData !== null && this.userData.userID === journeyResponse.data.journey.userID);
          this.journey = journeyResponse.data.journey;

          if (this.type === 'edit') {
            if (!this.userData || this.userData.userID !== this.journey.userID) {
              router.goBack();
              return;
            }
          }

          this.preRender();

          if (journeyResponse.status === 200 && journeyResponse.data.sights !== null) {
            journeyResponse.data.sights.map((sight) => this.IDs.push(sight.id));


            header = document.getElementById('header') as HTMLElement;

            new Header(header).render();

            journeyInfoDiv = document.getElementById('journey-info');
            title = document.createElement('h1');
            title.textContent = `${this.journey.name}`;
            journeyInfoDiv?.insertAdjacentElement('afterbegin', title);

            this.addSightsToOptions();

            const placelist = document.querySelector('#list-places') as HTMLDivElement;
            journeyResponse.data.sights.forEach((sight) => {
              new Place(placelist, sight).render();
              if (this.type === 'edit' || this.type === 'new') {
                this.renderDeletePlaceButton(String(sight.id));
              }
            });

            const editForm = document.querySelector('form') as HTMLFormElement;
            const editJourneyButton = document.getElementById('button-edit-journey');
            const deleteJourneyButton = document.getElementById('button-delete-journey');

            const deleteDialog = document.querySelector('.delete-dialog') as HTMLDialogElement;

            const deleteModalButton = deleteDialog.querySelector('#button-delete') as HTMLButtonElement;

            deleteJourneyButton?.addEventListener('click', () => {
              deleteDialog.showModal();
            });

            const cancelButton = document.querySelector('.cancel') as HTMLButtonElement;

            cancelButton.addEventListener('click', () => {
              deleteDialog.close();
            });

            deleteModalButton?.addEventListener('click', () => {
              post(`trip/${this.journey.id}/delete`, {}).then(() => {
                deleteDialog.close();
                router.go(urls.base);
              });
            });

            if (this.type === 'view') {
              editJourneyButton?.addEventListener('click', () => {
                router.go(ROUTES.journey.edit(this.tripID));
              });
              const buildRouteButton = document.getElementById('button-show-route') as HTMLButtonElement;

              if (buildRouteButton) {
                buildRouteButton.addEventListener('click', async () => {
                  try {
                    // 1. Получаем массив ID достопримечательностей
                    const sightIds = this.IDs;

                    if (sightIds.length < 2) {
                      alert('Для маршрута нужно минимум 2 точки!');
                      return;
                    }

                    // 2. Формируем данные в нужном формате
                    const formData = new URLSearchParams();

                    // 3. Добавляем основные точки
                    formData.append('start_point', String(sightIds[0]));
                    formData.append('end_point', String(sightIds[sightIds.length - 1]));

                    // 4. Добавляем промежуточные точки
                    sightIds.slice(1, -1).forEach((id, index) => {
                      formData.append(`dynamic_field_${index + 1}`, String(id));
                    });


                    // 5. Создаем скрытую форму
                    const form = document.createElement('form');
                    form.method = 'POST';
                    form.action = 'http://localhost:8000/showroute';
                    form.style.display = 'none';

                    // 6. Преобразуем URLSearchParams в скрытые поля формы
                    for (const [key, value] of formData.entries()) {
                      const input = document.createElement('input');
                      input.type = 'hidden';
                      input.name = key;
                      input.value = value;
                      form.appendChild(input);
                    }

                    // 7. Отправляем форму
                    document.body.appendChild(form);
                    form.submit();


                  } catch (error) {
                    console.error('Ошибка при построении маршрута:', error);
                    alert('Ошибка: ' + error.message);
                  }
                });
              }

            } else if (this.type === 'edit') {
              editForm.addEventListener('submit', (e: Event) => {

                form = document.querySelector('form') as HTMLFormElement;

                e.preventDefault();

                if (this.IDs.length === 0) {
                  new AuthorizationForm(this.parent, '').renderError(form, 'Выберите места для поездки');
                  return;
                }

                const userID = this.userData.userID;
                const nameInput = document.querySelector('input') as HTMLInputElement;
                const descriptionInput = document.querySelector('textarea') as HTMLTextAreaElement;
                const body = {
                  userID: userID, name: nameInput.value, description: descriptionInput.value, sightIDs: this.IDs,
                };

                post(`trip/${this.journey.id}/sight/add`, body).then((createJourneyResponse) => {
                  if (createJourneyResponse.status === 500) {
                    new AuthorizationForm(this.parent).renderError(form, 'Поездка с таким именем уже есть');
                    return;
                  }
                  this.type = 'view';
                  router.go(ROUTES.journey.view(this.tripID));
                });
              });
            }
          } else {
            router.go('404');
          }
        },
        );
        break;
    }
  }
}

export default JourneyPage;
