from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404, render
from django.urls import reverse
from django.views import generic
# from polls.python_vtk_file_reader.Dicom_file_reader import file_reader, controller, adjust_gamma, array_ext
import json
from .models import Choice, Question

# Working Perfectly

def IndexView(request):
    # template_name = 'polls/index1.html'
    # context_object_name = 'latest_question_list'
    # def get_queryset(self):
    # """Return the last five published questions."""
    # return Question.objects.order_by('-pub_date')[:5]

    # res = sum(3, 5)
    # reader = array_ext(directory)
    # reader = reader.tolist()
    # reader = json.dumps(reader)
    # print(reader)
    # print(type(reader))

    # context = {"r": reader, "text": "hola", "array": [4, 5]}
    return render(request, 'polls/Final_3D_viewer_html_file.html')


class DetailView(generic.DetailView):
    model = Question
    template_name = 'polls/detail.html'


class ResultsView(generic.DetailView):
    model = Question
    template_name = 'polls/results.html'


def vote(request, question_id):
    question = get_object_or_404(Question, pk=question_id)
    try:
        selected_choice = question.choice_set.get(pk=request.POST['choice'])
    except (KeyError, Choice.DoesNotExist):
        # Redisplay the question voting form.
        return render(request, '/home/yuvi/PycharmProjects/MPI_VTK_JS/mpi_vtk_js/polls/templates/polls/detail.html', {
            'question': question,
            'error_message': "You didn't select a choice.",
        })
    else:
        selected_choice.votes += 1
        selected_choice.save()
        # Always return an HttpResponseRedirect after successfully dealing
        # with POST data. This prevents data from being posted twice if a
        # user hits the Back button.
        return HttpResponseRedirect(reverse('polls:results', args=(question.id,)))
