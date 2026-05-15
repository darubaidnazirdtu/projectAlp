import { Api } from '../api/Api.js'

class BooksChaptersPublishedServices {
  constructor() {
    this.api = new Api(import.meta.env.VITE_BASEURL)
  }

  async getBooksChaptersPublished() {
    const response = await this.api.get('/books_chapters_published/get')
    return response
  }

  async createBooksChaptersPublished(data, headers = {}) {
    const response = await this.api.post('/books_chapters_published/set', data, headers)
    return response
  }

  async updateBooksChaptersPublished(id, data, headers = {}) {
    const response = await this.api.put(`/books_chapters_published/update/${id}`, data, headers)
    return response
  }

  async deleteBooksChaptersPublished(id) {
    const response = await this.api.delete(`/books_chapters_published/delete/${id}`)
    return response
  }

  async getBooksChaptersPublishedById(id) {
    const response = await this.api.get(`/books_chapters_published/get/${id}`)
    return response
  }
}

export const BooksChaptersPublishedService = new BooksChaptersPublishedServices();
