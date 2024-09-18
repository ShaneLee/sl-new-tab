let foodItems = []

function createMealPlan(mealPlan) {
  return api(mealPlanEndpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(mealPlan),
  }).then(response => {
    if (response) {
      return response.json()
    }
  })
}

function fetchMealOptions() {
  return api(allMealsEndpoint, {
    method: 'GET',
    headers: headers,
  }).then(res => (!!res ? res.json() : undefined))
}

function populateMealOptions(meals) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const daysContainer = document.getElementById('days')

  daysContainer.innerHTML = ''

  days.forEach(day => {
    const dayContainer = document.createElement('div')
    dayContainer.classList.add('day-container')
    dayContainer.innerHTML = `<h3>${day}</h3>`

    const mealList = document.createElement('ul')
    mealList.classList.add('meal-list')
    mealList.dataset.day = day.toLowerCase()

    const nutrientTotals = {
      calories: 0,
      carbohydrate: 0,
      fat: 0,
      protein: 0,
    }
    const nutrientDisplay = document.createElement('div')
    nutrientDisplay.classList.add('nutrient-display')

    const mealSelect = document.createElement('select')
    mealSelect.innerHTML = `<option value="">Select a meal</option>`
    meals.forEach(meal => {
      const option = document.createElement('option')
      option.value = meal.id
      option.text = meal.name
      mealSelect.appendChild(option)
    })

    const addButton = document.createElement('button')
    addButton.textContent = 'Add Meal'
    addButton.addEventListener('click', function (e) {
      e.preventDefault()
      const selectedMealId = mealSelect.value
      const selectedMeal = meals.find(meal => meal.id === selectedMealId)

      if (selectedMealId && selectedMeal) {
        const mealItem = document.createElement('li')
        mealItem.textContent = selectedMeal.name
        mealItem.dataset.mealId = selectedMealId
        mealItem.draggable = true

        const removeButton = document.createElement('span')
        removeButton.textContent = '×'
        removeButton.classList.add('remove-button')
        removeButton.addEventListener('click', function () {
          mealItem.remove()
          updateNutrientTotals(selectedMeal, -1, nutrientTotals, nutrientDisplay)
        })

        mealItem.appendChild(removeButton)

        mealItem.addEventListener('dragstart', handleDragStart)
        mealItem.addEventListener('dragover', handleDragOver)
        mealItem.addEventListener('drop', handleDrop)
        mealItem.addEventListener('dragend', handleDragEnd)

        mealList.appendChild(mealItem)

        updateNutrientTotals(selectedMeal, 1, nutrientTotals, nutrientDisplay)
      }
    })

    dayContainer.appendChild(mealSelect)
    dayContainer.appendChild(addButton)
    dayContainer.appendChild(mealList)
    dayContainer.appendChild(nutrientDisplay)
    daysContainer.appendChild(dayContainer)
  })
}

// Handle drag and drop events
let draggedItem = null

function handleDragStart(e) {
  draggedItem = this
  setTimeout(() => (this.style.display = 'none'), 0)
}

function handleDragOver(e) {
  e.preventDefault()
}

function handleDrop(e) {
  e.preventDefault()
  if (this !== draggedItem) {
    const list = this.parentNode
    list.insertBefore(draggedItem, this)
  }
}

function handleDragEnd() {
  setTimeout(() => (this.style.display = 'block'), 0)
  draggedItem = null
}

function updateNutrientTotals(meal, multiplier, totals, displayElement) {
  const nutrients = meal.nutrients

  // Noddy hack
  if (!nutrients.calories?.amount) {
    nutrients.calories = { amount: nutrients.calories, unit: 'UNIT' }
  }

  totals.calories += parseFloat(nutrients.calories.amount) * multiplier
  totals.carbohydrate += parseFloat(nutrients.carbohydrate.amount) * multiplier
  totals.fat += parseFloat(nutrients.fat.amount) * multiplier
  totals.protein += parseFloat(nutrients.protein.amount) * multiplier

  displayElement.textContent = `Total Nutrients:
    Calories: ${totals.calories.toFixed(2)} g,
    Carbohydrate: ${totals.carbohydrate.toFixed(2)} g,
    Fat: ${totals.fat.toFixed(2)} g,
    Protein: ${totals.protein.toFixed(2)} g`
}

function addMealPlanFormListener() {
  document.getElementById('mealPlanForm').addEventListener('submit', function (event) {
    event.preventDefault()

    const formData = new FormData(this)
    const mealPlan = {
      name: formData.get('name'),
      effectiveFrom: formData.get('effectiveFrom'),
      monday: Array.from(formData.getAll('monday[]')).map((id, order) => ({
        id,
        order: order + 1,
      })),
      tuesday: Array.from(formData.getAll('tuesday[]')).map((id, order) => ({
        id,
        order: order + 1,
      })),
      wednesday: Array.from(formData.getAll('wednesday[]')).map((id, order) => ({
        id,
        order: order + 1,
      })),
      thursday: Array.from(formData.getAll('thursday[]')).map((id, order) => ({
        id,
        order: order + 1,
      })),
      friday: Array.from(formData.getAll('friday[]')).map((id, order) => ({
        id,
        order: order + 1,
      })),
      saturday: Array.from(formData.getAll('saturday[]')).map((id, order) => ({
        id,
        order: order + 1,
      })),
      sunday: Array.from(formData.getAll('sunday[]')).map((id, order) => ({
        id,
        order: order + 1,
      })),
    }

    createMealPlan(mealPlan)
  })
}

function addMealOptions() {
  fetchMealOptions().then(meals => {
    if (meals) {
      populateMealOptions(meals)
    }
  })

  addMealPlanFormListener()
}

function createFoodItem(foodItem) {
  return api(foodItemEndpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(foodItem),
  }).then(response => {
    if (response) {
      return response.json()
    }
  })
}

function populateFoodItems(foodItems) {
  const select = document.getElementById('foodSelect')
  foodItems.forEach(item => {
    const option = document.createElement('option')
    option.value = item.id
    option.textContent = item.name
    select.appendChild(option)
  })
}

function addFoodItemFormListener() {
  document.getElementById('foodItemForm').addEventListener('submit', function (event) {
    event.preventDefault()

    const formData = new FormData(this)

    const foodItem = {
      name: formData.get('name'),
      sources: formData
        .get('sources')
        .split(',')
        .map(s => s.trim()),
      nutrientSources: formData
        .get('nutrientSources')
        .split(',')
        .map(s => s.trim()),
      reference: `${formData.get('reference')}`,
      nutrients: {
        nutrients: {
          calories: {
            name: 'calories',
            value: `${formData.get('calories')}:UNIT`,
          },
          carbohydrate: {
            name: 'carbohydrate',
            value: `${formData.get('carbohydrate')}:g`,
          },
          fat: { name: 'fat', value: `${formData.get('fat')}:g` },
          protein: { name: 'protein', value: `${formData.get('protein')}:g` },
        },
      },
    }

    createFoodItem(foodItem)
  })
}

function addFoodItemOptions() {
  api(foodItemEndpoint, { method: 'GET', headers: headers })
    .then(res => (!!res ? res.json() : undefined))
    .then(fetchedFoodItems => {
      foodItems = fetchedFoodItems
      populateFoodItems(foodItems)

      document.getElementById('addFoodItem').addEventListener('click', addFoodItem)
    })

  addMealFormListener()
}

function updateNutrientInfoAndTotals() {
  const totals = {
    calories: 0,
    carbohydrate: 0,
    fat: 0,
    protein: 0,
  }

  document.querySelectorAll('.food-item').forEach((itemDiv, index) => {
    const selectElement = document.getElementById(`foodItemSelect-${index}`)
    const sliderElement = document.getElementById(`foodItemSlider-${index}`)
    const sliderValue = parseFloat(sliderElement.value)
    const selectedFoodId = selectElement.value
    const foodItem = foodItems.find(item => item.id === selectedFoodId)

    if (foodItem) {
      const updatedNutrients = {
        calories: nutrientValueCalculation(
          foodItem.nutrients.nutrients.CALORIES,
          sliderValue,
          foodItem.nutrients.nutrients.CALORIES,
        ),
        carbohydrate: nutrientValueCalculation(
          foodItem.nutrients.nutrients.CARBOHYDRATE,
          sliderValue,
          foodItem.nutrients.nutrients.CARBOHYDRATE,
        ),
        fat: nutrientValueCalculation(
          foodItem.nutrients.nutrients.FAT,
          sliderValue,
          foodItem.nutrients.nutrients.FAT,
        ),
        protein: nutrientValueCalculation(
          foodItem.nutrients.nutrients.PROTEIN,
          sliderValue,
          foodItem.nutrients.nutrients.PROTEIN,
        ),
      }

      totals.calories += parseFloat(updatedNutrients.calories.amount)
      totals.carbohydrate += parseFloat(updatedNutrients.carbohydrate.amount)
      totals.fat += parseFloat(updatedNutrients.fat.amount)
      totals.protein += parseFloat(updatedNutrients.protein.amount)

      document.getElementById(`nutrient-info-${index}`).textContent =
        `Calories: ${updatedNutrients.calories.amount} ${updatedNutrients.calories.value.unit}
                Carbohydrate: ${updatedNutrients.carbohydrate.amount} ${updatedNutrients.carbohydrate.value.unit}
                Fat: ${updatedNutrients.fat.amount} ${updatedNutrients.fat.value.unit}
                Protein: ${updatedNutrients.protein.amount} ${updatedNutrients.protein.value.unit}`
    }
  })

  document.getElementById('totals').innerHTML = `
        Total Calories: ${totals.calories.toFixed(2)} UNIT
        Total Carbohydrate: ${totals.carbohydrate.toFixed(2)} g
        Total Fat: ${totals.fat.toFixed(2)} g
        Total Protein: ${totals.protein.toFixed(2)} g
    `
}

function nutrientValueCalculation(nutrient, referenceValue, originalReference) {
  function convertToBaseUnit(amount, unit) {
    switch (unit) {
      case 'µg':
        return amount / 1e6 // µg to g
      case 'mg':
        return amount / 1e3 // mg to g
      default:
        return amount
    }
  }

  function valueAmount(nutrient) {
    if (!!nutrient.value?.amount) {
      return parseFloat(nutrient.value.amount)
    }

    if (!isNaN(nutrient.amount)) {
      return parseFloat(nutrient.amount)
    }

    return parseFloat(nutrient.amount.amount)
  }

  function valueUnit(nutrient) {
    if (!!nutrient.value?.unit) {
      return nutrient.value.unit
    }

    if (!!nutrient.amount?.unit) {
      return nutrient.amount.unit
    }

    return nutrient.unit
  }

  const nutrientAmount = valueAmount(nutrient)
  const nutrientUnit = valueUnit(nutrient)
  const referenceAmount = parseFloat(referenceValue)
  const originalReferenceAmount = valueAmount(originalReference)
  const originalReferenceUnit = valueUnit(originalReference)

  const baseNutrientAmount = convertToBaseUnit(nutrientAmount, nutrientUnit)
  const baseOriginalReferenceAmount = convertToBaseUnit(
    originalReferenceAmount,
    originalReferenceUnit,
  )
  const baseReferenceAmount = convertToBaseUnit(referenceAmount, originalReferenceUnit)

  const adjustedAmount = (
    (baseNutrientAmount * baseReferenceAmount) /
    baseOriginalReferenceAmount
  ).toFixed(2)

  return {
    ...nutrient,
    amount: adjustedAmount,
  }
}

function handleSliderChange(event) {
  updateNutrientInfoAndTotals()
}

function addFoodItem() {
  const container = document.getElementById('foodItemsContainer')
  const index = container.children.length

  const itemDiv = document.createElement('div')
  itemDiv.classList.add('food-item')
  itemDiv.dataset.index = index

  const selectElement = document.createElement('select')
  selectElement.id = `foodItemSelect-${index}`
  selectElement.name = `foodItem-${index}`

  foodItems.forEach(item => {
    const option = document.createElement('option')
    option.value = item.id
    option.textContent = item.name
    selectElement.appendChild(option)
  })

  const sliderElement = document.createElement('input')
  sliderElement.type = 'range'
  sliderElement.id = `foodItemSlider-${index}`
  sliderElement.min = '0'
  sliderElement.max = '500'
  sliderElement.value = '100'

  const sliderValueElement = document.createElement('span')
  sliderValueElement.id = `foodItemValue-${index}`
  sliderValueElement.textContent = '100'
  sliderValueElement.style.display = 'none'

  const nutrientInfoElement = document.createElement('div')
  nutrientInfoElement.id = `nutrient-info-${index}`

  const foodSelect = document.getElementById('foodSelect')

  // Unselect the selected option
  foodSelect.selectedIndex = -1

  selectElement.addEventListener('change', function () {
    sliderElement.style.display = 'block'
    sliderValueElement.style.display = 'inline' // Show slider when item is selected
    handleSliderChange()
  })

  sliderElement.addEventListener('input', function () {
    sliderValueElement.textContent = sliderElement.value
    handleSliderChange()
  })

  itemDiv.appendChild(selectElement)
  itemDiv.appendChild(sliderElement)
  itemDiv.appendChild(sliderValueElement)
  itemDiv.appendChild(nutrientInfoElement)

  container.appendChild(itemDiv)

  updateNutrientInfoAndTotals()
}

function addMealFormListener() {
  document.getElementById('mealForm').addEventListener('submit', function (event) {
    event.preventDefault()

    const formData = new FormData(this)
    const components = []

    const foodItemsContainer = document.getElementById('foodItemsContainer')

    foodItemsContainer.querySelectorAll('.food-item').forEach((foodItem, index) => {
      const foodItemId = foodItem.querySelector(`#foodItemSelect-${index}`).value
      const slider = foodItem.querySelector(`#foodItemSlider-${index}`)
      const foodItemObj = foodItems.find(val => val.id === foodItemId)
      const amount = `${slider.value}:${foodItemObj.reference.unit}`

      if (amount && foodItemId) {
        components.push({
          id: foodItemId,
          amount: amount,
        })
      }
    })

    const meal = {
      name: formData.get('name'),
      components: components,
    }

    createMeal(meal)
  })
}

function createMeal(meal) {
  return api(mealEndpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(meal),
  }).then(response => {
    if (response) {
      return response.json()
    }
  })
}

function addFoodItemCsvFormListener() {
  document.getElementById('foodItemCsvForm').addEventListener('submit', function (event) {
    event.preventDefault()

    const formData = new FormData(this)

    const csv = formData.get('csvFoodItems')
    createMealFromCSV(csv)
  })
}

function createMealFromCSV(csv) {
  return api(foodItemCsvEndpoint, {
    method: 'POST',
    headers: headers,
    body: csv,
  }).then(response => {
    if (response) {
      return response.json()
    }
  })
}

window.addEventListener('load', addFoodItemOptions)
window.addEventListener('load', addFoodItemFormListener)
window.addEventListener('load', addFoodItemCsvFormListener)
window.addEventListener('load', addMealOptions)
